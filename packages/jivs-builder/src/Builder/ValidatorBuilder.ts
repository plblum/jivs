/**
 * Part of the Builder fluent sequence. It configures a validator, with representations
 * of all conditions in Jivs amongst its methods.
 * It is typically returned by the Builder.field('name') method to start a chain.
 * Each condition method returns the same ValidatorBuilder for chaining.
 * 
 * ```ts
 * builder.field('fieldname').requireText('Error message', 'Summary message')
 *    .regExp(/^[a-z]+$/, 'Error message', 'Summary message')
 *   .notNull('Error message', 'Summary message');
 * ```
 * 
 * The ValidatorBuilder modifies ValidatableValueHostBaseConfig objects, of which FieldValueHostConfig
 * is the typical use case.
 * Each validator is added to the parent ValidatableValueHostBaseConfig.validatorConfigs array.
 * 
 * @module jivs-builder/Builders/ConcreteClasses
 */

import {
    AllMatchConditionConfig, AnyMatchConditionConfig,
    CountMatchesConditionConfig, DataTypeCheckConditionConfig,
    IntegerConditionConfig,
     MaxDecimalsConditionConfig,
    NotNullConditionConfig, PositiveConditionConfig,
    RangeConditionConfig, RegExpConditionConfig,
    RequireTextConditionConfig, StringLengthConditionConfig
} from '@plblum/jivs-engine/build/Conditions/ConcreteConditions';
import {
    EqualToConditionConfig, EqualToValueConditionConfig,
    GreaterThanConditionConfig, GreaterThanOrEqualConditionConfig,
    GreaterThanOrEqualValueConditionConfig, GreaterThanValueConditionConfig,
    LessThanConditionConfig,
    LessThanOrEqualConditionConfig, LessThanOrEqualValueConditionConfig,
    LessThanValueConditionConfig, 
    NotEqualToConditionConfig, NotEqualToValueConditionConfig,

} from '@plblum/jivs-engine/build/Conditions/ComparisonCondition_classes';
import { NotConditionConfig } from '@plblum/jivs-engine/build/Conditions/NotCondition';
import { WhenConditionConfig } from '@plblum/jivs-engine/build/Conditions/WhenCondition';
import { ValueHostName } from '@plblum/jivs-engine/build/DataTypes/BasicTypes';
import {
    CompleteConfigBuilderHandler,
    ConditionBuilderHandler,
    ConditionWithChildrenBuilderHandler,
    FluentAllMatchValidatorConfig,
    FluentAnyMatchValidatorConfig, FluentCountMatchesValidatorConfig,
    FluentDataTypeCheckValidatorConfig, FluentEqualToValidatorConfig,
    FluentEqualToValueValidatorConfig, FluentGreaterThanOrEqualValidatorConfig,
    FluentGreaterThanOrEqualValueValidatorConfig, FluentGreaterThanValidatorConfig,
    FluentGreaterThanValueValidatorConfig, FluentIntegerValidatorConfig,
    FluentLessThanOrEqualValidatorConfig, FluentLessThanOrEqualValueValidatorConfig,
    FluentLessThanValidatorConfig, FluentLessThanValueValidatorConfig,
    FluentMaxDecimalsValidatorConfig, FluentNotEqualToValidatorConfig,
    FluentNotEqualToValueValidatorConfig, FluentNotNullValidatorConfig,
    FluentNotValidatorConfig, FluentPositiveValidatorConfig, FluentRangeValidatorConfig,
    FluentRegExpValidatorConfig, FluentRequireTextValidatorConfig,
    FluentStringLengthValidatorConfig, FluentWhenValidatorConfig,
    IConditionBuilder,
    IValidatorBuilder
} from '../Interfaces/ChildBuilders';
import { ConditionConfig, ICondition } from '@plblum/jivs-engine/build/Interfaces/Conditions';
import { FieldValueHostConfig } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { FluentValidatorConfig } from '../Interfaces/ValueHostConfigBuilders';
import { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { ValidatorConfig } from '@plblum/jivs-engine/build/Interfaces/Validator';
import { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import { resolveErrorCode } from '@plblum/jivs-engine/build/Utilities/Validation';
import { BuilderConfigHostBase } from './BuilderConfigHostBase';


/**
 * Supplies Conditions and Validators the preceding FieldValueHost in a fluent chain. 
 * It is returned by ValueHostsManagerConfigBuilder.field() and each chained object that follows.
 * 
 * See {@link jivs-builder/Builders/ConcreteClasses!ValueHostsManagerConfigBuilder:class | Builder Overview}
 */
export class ValidatorBuilder
    extends BuilderConfigHostBase<object>
    implements IValidatorBuilder {
    /**
     * Constructor
     * @param parentConfig - Config object from the parent to host this validator.
     */
    constructor(services: IJivsServices,
        parentConfig: FieldValueHostConfig,
        completed?: CompleteConfigBuilderHandler<object>) {
        super(services, null, completed);
        assertNotNull(parentConfig, 'parentConfig');
        if (!parentConfig.validatorConfigs)
            parentConfig.validatorConfigs = [];
        this._parentConfig = parentConfig;
    }

    /**
     * This is the value ultimately passed to the ValueHostsManager config.ValueHostConfigs.
     */
    public get parentConfig(): FieldValueHostConfig {
        return this._parentConfig;
    }
    private readonly _parentConfig: FieldValueHostConfig;

    /**
     * Overloading validator fluent functions is a bit tricky. This function will resolve the parameters
     * and return a single object with the results.
     * It can be used in most functions because the parameters are similar. The only difference is the type of conditionConfig.
     * @param arg2 
     * @param arg3 
     * @returns 
     */
    protected resolveOverloadArgs<TConditionConfig extends ConditionConfig>(
        arg2?: string | null | object,
        arg3?: string | null
    ): FluentOverloadArgs<TConditionConfig> {
        let conditionConfig: TConditionConfig | null | undefined = undefined;
        let errorMessage: string | null | undefined = undefined;
        let summaryMessage: string | null | undefined = undefined;
        let validatorParameters: FluentValidatorConfig | undefined = undefined;

        if (typeof arg2 === 'string' || arg2 === null || arg2 === undefined) {
            errorMessage = arg2 ?? null;
            summaryMessage = arg3 ?? null;
        }
        else if (typeof arg2 === 'object') {
            // arg3 is ignored here
            conditionConfig = { ...arg2 } as TConditionConfig;
            for (const prop of Object.keys(conditionConfig as object)) {
                if (FluentValidatorConfigPropertyNames.includes(prop)) {
                    delete (conditionConfig as any)[prop];
                }
            }

            validatorParameters = { ...arg2 };
            for (const prop of Object.keys(validatorParameters as object)) {
                if (!FluentValidatorConfigPropertyNames.includes(prop)) {
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
     * Finishes the creation of a Validator's condition. Each condition function within this Builder
     * only has to prepare the parameters, then call this to add the condition config
     * and get back the same ValidatorBuilder for chaining.
     * @param conditionBuilder - The condition builder that has the condition config to add to the validatorConfig.
     * @param errorMessage - optional error message. Will overwrite any from validatorConfig if
     * supplied.
     * @param summaryMessage - optional summary message. Will overwrite any from validatorConfig if
     * supplied.
     * @param validatorConfig - any validator level parameters to add to the validatorConfig. 
     * @returns The current instance of ValidatorBuilder to allow for method chaining.
     */
    protected finish(conditionBuilder: IConditionBuilder | null,
        errorMessage: string | null | undefined,
        summaryMessage: string | null | undefined,
        validatorConfig: FluentValidatorConfig | undefined | null): IValidatorBuilder {
        const ivDesc: ValidatorConfig = validatorConfig ?
            { ...validatorConfig as ValidatorConfig } :
            { conditionConfig: null };
        if (errorMessage != null)   // null or undefined
            ivDesc.errorMessage = errorMessage;
        if (summaryMessage != null)   // null or undefined
            ivDesc.summaryMessage = summaryMessage;

        if (conditionBuilder !== null) {
            const conditionConfig = conditionBuilder.getConfig();
            assertNotNull(conditionConfig);
            assertNotNull(conditionConfig?.conditionType);
            if (conditionConfig)
                ivDesc.conditionConfig = { ...conditionConfig as ConditionConfig };
        }
        else if (ivDesc.conditionCreator == null)   // null or undefined
            this.reportError(new Error('ValidatorConfig must have either a conditionConfig or a conditionCreator.'));   // throws

        // prevent duplicate errorcodes
        const errorCode = resolveErrorCode(ivDesc);
        if (this.parentConfig.validatorConfigs!.find((ivConfig) => resolveErrorCode(ivConfig) === errorCode))
            this.reportError(new Error(`ValueHost name "${this._parentConfig.name}" with errorCode ${errorCode} already defined.`));    // throws

        this.parentConfig.validatorConfigs!.push(ivDesc as ValidatorConfig);
        return this;    // chain!
    }

    /**
     * Creates the ConditionBuilder used by each Fluent validator function
     * using the one defined in BuildersFactory on JivsServices.
     * @returns 
     */
    protected createConditionBuilder(completed?: CompleteConfigBuilderHandler<any>): IConditionBuilder
    {
        return this.services.buildersFactory.createConditionBuilder(this, completed);
    }

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
    public customRule(this: any, conditionCreator: (requester: ValidatorConfig) => ICondition | null,
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    public customRule(this: any, conditionCreator: (requester: ValidatorConfig) => ICondition | null,
        validatorParameters: FluentValidatorConfig): IValidatorBuilder;
    public customRule(conditionCreator: (requester: ValidatorConfig) => ICondition | null,
        arg1?: FluentValidatorConfig | string | null,
        arg2?: string | null): IValidatorBuilder {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { conditionConfig, errorMessage, summaryMessage, validatorParameters } =
            this.resolveOverloadArgs<ConditionConfig>(arg1, arg2);
        const ivConfig: ValidatorConfig = validatorParameters ?
            { ...validatorParameters as ValidatorConfig, conditionConfig: null } :
            { conditionConfig: null };
        ivConfig.conditionCreator = conditionCreator;
        this.finish(null, errorMessage, summaryMessage, ivConfig);
        return this;
    }

    /**
     * Adds a DataTypeCheck condition to the fluent validator builder.
     * DataTypeCheck ensures that the value being validated matches the expected data type.
     * In many cases, it is automatically added by the ValueHost based on the dataType field value.
     * Example usage:
     * ```ts
     * dataTypeCheck();
     * dataTypeCheck('Error message');
     * dataTypeCheck('Error message', 'Summary message');
     * dataTypeCheck(null, 'Summary message');
     * dataTypeCheck({ errorMessage: 'Error message'});
     * ```
     * @param errorMessage 
     * The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
     */
    public dataTypeCheck(
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    /**
     * Adds a DataTypeCheck condition to the fluent validator builder.
     * DataTypeCheck ensures that the value being validated matches the expected data type.
     * In many cases, it is automatically added by the ValueHost based on the dataType field value.
     * Example usage:
     * ```ts
     * dataTypeCheck();
     * dataTypeCheck('Error message');
     * dataTypeCheck('Error message', 'Summary message');
     * dataTypeCheck(null, 'Summary message');
     * dataTypeCheck({ errorMessage: 'Error message'});
     * ```
     * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
     * Includes several validation parameters not available in the other overload, including severity and the errorCode.
     */    
    public dataTypeCheck(
        validatorParameters: FluentDataTypeCheckValidatorConfig): IValidatorBuilder;
    public dataTypeCheck(
        arg1?: FluentDataTypeCheckValidatorConfig | string | null,
        arg2?: string | null): IValidatorBuilder {
        // no ConditionConfig parameter because without conditionType and valueHostName, it will always be empty   
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<DataTypeCheckConditionConfig>(arg1, arg2);
        const conditionBuilder = this.createConditionBuilder();
        conditionBuilder.dataTypeCheck();
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }

    /**
      * Adds a RequireText condition to the fluent validator builder.
      * RequireText ensures that the value being validated is not empty.
      * The value must be a string or null or it evaluates as Undetermined.
      * When evaluating against null, set its nullValueResult parameter to determine
      * whether the condition should evaluate as NoMatch, Match, or Undetermined.
      * If not supplied, null is treated as NoMatch.
      * Example usage:
      * ```ts
      * requireText();
      * requireText('Error message');
      * requireText('Error message', 'Summary message');
      * requireText(null, 'Summary message');
      * requireText({ errorMessage: 'Error message'});
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
    public requireText(
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    /**
      * Adds a RequireText condition to the fluent validator builder.
      * RequireText ensures that the value being validated is not empty.
      * The value must be a string or null or it evaluates as Undetermined.
      * When evaluating against null, set its nullValueResult parameter to determine
      * whether the condition should evaluate as NoMatch, Match, or Undetermined.
      * If not supplied, null is treated as NoMatch.
      * Example usage:
      * ```ts
      * requireText();
      * requireText('Error message');
      * requireText('Error message', 'Summary message');
      * requireText(null, 'Summary message');
      * requireText({ errorMessage: 'Error message'});
      * ```
      * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
      * Includes several validation parameters not available in the other overload, including severity and the errorCode.
      * Additional ways to customize the Validator, including localized error messages,
      * severity, and the enabler.
      */    
    public requireText(
        validatorParameters: FluentRequireTextValidatorConfig): IValidatorBuilder;
    public requireText(
        arg1?: string | null | FluentRequireTextValidatorConfig,
        arg2?: string | null): IValidatorBuilder {
        const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<RequireTextConditionConfig>(arg1, arg2);
        const conditionBuilder = this.createConditionBuilder();
        conditionBuilder.requireText(conditionConfig as RequireTextConditionConfig);
        
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }

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
     * Additional ways to customize the Validator, including localized error messages,
     * severity, and the enabler.
     */
    public notNull(
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
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
     * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
     * Includes several validation parameters not available in the other overload, including severity and the errorCode.
     */    
    public notNull(
        validatorParameters: FluentNotNullValidatorConfig): IValidatorBuilder;
    public notNull(
        arg1?: string | null | FluentNotNullValidatorConfig,
        arg2?: string | null): IValidatorBuilder {
        // no ConditionConfig parameter because without conditionType and valueHostName, it will always be empty  
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<NotNullConditionConfig>(arg1, arg2);
        const conditionBuilder = this.createConditionBuilder();
        conditionBuilder.notNull();
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }

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
     * @param expression - The regular expression as a RegExp object to match against the value being validated. 
     * @param errorMessage 
     * The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
     */
    public regExp(
        expression: RegExp,
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
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
     * @param expression - The regular expression as a string to match against the value being validated. 
     * @param ignoreCase - optional flag to indicate if the regular expression should ignore case. Only applicable when the expression is a string.
     * @param errorMessage 
     * The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
     */
    public regExp(
        expression: string,
        ignoreCase?: boolean,
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
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
     * @param expression - The regular expression as a RegExp object to match against the value being validated. 
     * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
     * Includes several validation parameters not available in the other overload, including severity and the errorCode.
     */    
    public regExp(
        expression: RegExp,
        validatorParameters: FluentRegExpValidatorConfig): IValidatorBuilder;
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
     * @param expression - The regular expression as a string to match against the value being validated. 
     * @param ignoreCase - optional flag to indicate if the regular expression should ignore case. Only applicable when the expression is a string.
     * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
     * Includes several validation parameters not available in the other overload, including severity and the errorCode.
     */    
    public regExp(
        expression: string,
        ignoreCase: boolean,
        validatorParameters: FluentRegExpValidatorConfig): IValidatorBuilder;
    public regExp(
        expression: RegExp | string, // can be either a RegExp or a string, but if string, then ignoreCase is needed
        arg2?: string | boolean | FluentRegExpValidatorConfig | null,
        arg3?: string | null | FluentRegExpValidatorConfig,
        arg4?: string | null | FluentRegExpValidatorConfig): IValidatorBuilder {
        if (arg2 && typeof arg2 === 'string') { // then both arg2 and arg3 are errorMessage and summaryMessage

            // expression, error message, summary message
            const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                this.resolveOverloadArgs<RegExpConditionConfig>(arg2, arg3 as string | null);

            const conditionBuilder = this.createConditionBuilder();
            conditionBuilder.regExp(expression, undefined, conditionConfig as RegExpConditionConfig);
            return this.finish(conditionBuilder, errorMessage, summaryMessage, validatorParameters);
        }
        else if (arg2 && typeof arg2 === 'object') { // then arg2 is validatorParameters
            // expression, validatorParameters
            const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                this.resolveOverloadArgs<RegExpConditionConfig>(arg2 as FluentRegExpValidatorConfig);
            const conditionBuilder = this.createConditionBuilder();
            conditionBuilder.regExp(expression, undefined, conditionConfig as RegExpConditionConfig);
            return this.finish(conditionBuilder, errorMessage, summaryMessage, validatorParameters);
        }
        else if (typeof arg2 === 'boolean') { // then arg2 is ignoreCase
            const ignoreCase = arg2 as boolean;
            if (arg3 && typeof arg3 === 'string') { // then both arg3 and arg4 are errorMessage and summaryMessage
                // string expression, ignoreCase, error message, summary message
                const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                    this.resolveOverloadArgs<RegExpConditionConfig>(arg3 as string | null, arg4 as string | null);
                const conditionBuilder = this.createConditionBuilder();
                conditionBuilder.regExp(expression, ignoreCase, conditionConfig as RegExpConditionConfig);
                return this.finish(conditionBuilder, errorMessage, summaryMessage, validatorParameters);
                        
            }
            else if (arg3 && typeof arg3 === 'object') { // then arg3 is validatorParameters
                // string expression, ignoreCase, validatorParameters
                const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                    this.resolveOverloadArgs<RegExpConditionConfig>(arg3 as FluentRegExpValidatorConfig);
                const conditionBuilder = this.createConditionBuilder();
                conditionBuilder.regExp(expression, ignoreCase, conditionConfig as RegExpConditionConfig);
                return this.finish(conditionBuilder, errorMessage, summaryMessage, validatorParameters);
            }
            if (arg4 && typeof arg4 === 'string') { // because arg3 is null as a placeholder for errormessage
                // string expression, ignoreCase, null for error message, summary message
                const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                    this.resolveOverloadArgs<RegExpConditionConfig>(arg3 as string | null, arg4 as string);
                const conditionBuilder = this.createConditionBuilder();
                conditionBuilder.regExp(expression, ignoreCase, conditionConfig as RegExpConditionConfig);
                return this.finish(conditionBuilder, errorMessage, summaryMessage, validatorParameters);
            }
                
            else {
                // string expression, ignoreCase
                const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                    this.resolveOverloadArgs<RegExpConditionConfig>(null, null);
                const conditionBuilder = this.createConditionBuilder();
                conditionBuilder.regExp(expression, ignoreCase, conditionConfig as RegExpConditionConfig);
                return this.finish(conditionBuilder, errorMessage, summaryMessage, validatorParameters);
            }
        }
        else if (arg3 && typeof arg3 === 'object') { // then arg3 is validatorParameters and arg2 is likely undefined
            // expression, undefined, validatorParameters
            const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                this.resolveOverloadArgs<RegExpConditionConfig>(arg3 as FluentRegExpValidatorConfig);
            const conditionBuilder = this.createConditionBuilder();
            conditionBuilder.regExp(expression, undefined, conditionConfig as RegExpConditionConfig);
            return this.finish(conditionBuilder, errorMessage, summaryMessage, validatorParameters);
        }
        else if (expression instanceof RegExp && arg2 == null && (typeof arg3 === 'string') && arg4 == null) { // then arg2 is error message = null and arg3 is summaryMessage and arg4 is unused
            // RegExp expression, null for error message, string for summary message
            const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                this.resolveOverloadArgs<RegExpConditionConfig>(null, arg3 as string | null);
            const conditionBuilder = this.createConditionBuilder();
            conditionBuilder.regExp(expression, undefined, conditionConfig as RegExpConditionConfig);
            return this.finish(conditionBuilder, errorMessage, summaryMessage, validatorParameters);
        }
        else if (typeof expression === 'string' && arg3 == null && (typeof arg4 === 'string')) { // then arg2 is ignoreCase = undefined, arg3 is errorMessage = null and arg4 is summaryMessage
            // string expression, ignoreCase = undefined, errorMessage = null, summaryMessage
            const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                this.resolveOverloadArgs<RegExpConditionConfig>(null, arg4 as string | null);
            const conditionBuilder = this.createConditionBuilder();
            conditionBuilder.regExp(expression, undefined, conditionConfig as RegExpConditionConfig);
            return this.finish(conditionBuilder, errorMessage, summaryMessage, validatorParameters);
        }
        else if (arg2 == null && (typeof arg3 === 'string' || typeof arg4 === 'string')) { // then arg2 is null, arg3 is errorMessage and arg4 is summaryMessage
            // expression, null for ignoreCase, error message or null, summary message or null
            const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                this.resolveOverloadArgs<RegExpConditionConfig>(arg3 as string | null, arg4 as string | null);
            const conditionBuilder = this.createConditionBuilder();
            conditionBuilder.regExp(expression, undefined, conditionConfig as RegExpConditionConfig);
            return this.finish(conditionBuilder, errorMessage, summaryMessage, validatorParameters);
        }
        // fall-thru
        const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<RegExpConditionConfig>(null, null);
        const conditionBuilder = this.createConditionBuilder();
        conditionBuilder.regExp(expression, undefined, conditionConfig as RegExpConditionConfig);
        return this.finish(conditionBuilder, errorMessage, summaryMessage, validatorParameters);
        
    }


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
     */
    public range(
        minimum: any,
        maximum: any,
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
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
     * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
     * Includes several validation parameters not available in the other overload, including severity and the errorCode.
     */    
    public range(
        minimum: any,
        maximum: any,
        validatorParameters: FluentRangeValidatorConfig): IValidatorBuilder;

    public range(
        minimum: any, maximum: any,
        arg3?: string | null | FluentRangeValidatorConfig,
        arg4?: string | null): IValidatorBuilder {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<RangeConditionConfig>(arg3, arg4);
        const conditionBuilder = this.createConditionBuilder();
        conditionBuilder.range(minimum, maximum);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }

    /**
     * Adds a validator that ensures the value is equal to the specified second value.
     * @example
     * ```ts
     * equalToValue(42);
     * equalToValue(42, "Value must be {value}.");
     * equalToValue(42, "Value must be 42.", "Summary message");
     * equalToValue(42, {
     *      errorMessage: "Value must be 42.", 
     *      summaryMessage: "Summary message" });
     * ```
     * @param secondValue - The value to compare against the current value.
     * @param errorMessage - The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */
    public equalToValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IValidatorBuilder;
    /**
     * Adds a validator that ensures the value is equal to the specified second value.
     * @example
     * ```ts
     * equalToValue(42);
     * equalToValue(42, "Value must be {value}.");
     * equalToValue(42, "Value must be 42.", "Summary message");
     * equalToValue(42, {
     *      errorMessage: "Value must be 42.", 
     *      summaryMessage: "Summary message" });
     * ```
     * @param secondValue - The value to compare against the current value.
     * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
     * Includes several validation parameters not available in the other overload, including severity and the errorCode.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */    
    public equalToValue(
        secondValue: any,
        validatorParameters: FluentEqualToValueValidatorConfig): IValidatorBuilder;
    public equalToValue(
        secondValue: any,
        arg2?: FluentEqualToValueValidatorConfig | string | null,
        arg3?: string | null): IValidatorBuilder {
        return this.equalToValue_common(secondValue, arg2, arg3);
    }
    /**
     * Allows several aliases to setup equalToValue
     * @param secondValue 
     * @param arg2 
     * @param arg3 
     * @returns 
     */
    protected equalToValue_common(
        secondValue: any,
        arg2?: FluentEqualToValueValidatorConfig | string | null,
        arg3?: string | null): IValidatorBuilder {
        const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<EqualToValueConditionConfig>(arg2, arg3);
        const conditionBuilder = this.createConditionBuilder();
        conditionBuilder.equalToValue(secondValue, conditionConfig as EqualToValueConditionConfig);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }

    /**
     * Alias for equalToValue
     * @param secondValue - The value to compare against the current value.
     * @param errorMessage 
     * @param summaryMessage 
     */
    public eqValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IValidatorBuilder;
    /**
     * Alias for equalToValue
     * @param secondValue - The value to compare against the current value.
     * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
     * Includes several validation parameters not available in the other overload, including severity and the errorCode.
     */
    public eqValue(
        secondValue: any,
        validatorParameters: FluentEqualToValueValidatorConfig): IValidatorBuilder;
    public eqValue(
        secondValue: any,
        arg2?: FluentEqualToValueValidatorConfig | string | null,
        arg3?: string | null): IValidatorBuilder {
        return this.equalToValue_common(secondValue, arg2, arg3);
    }

    /**
     * Adds a validator that ensures the value is equal to the second value host.
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
     * @returns The current instance of ValidatorBuilder for method chaining.
     */    
    public equalTo(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    /**
     * Adds a validator that ensures the value is equal to the second value host.
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
     * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
     * Includes several validation parameters not available in the other overload, including severity and the errorCode.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */
    public equalTo(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentEqualToValidatorConfig): IValidatorBuilder;
    public equalTo(
        secondValueHostName: ValueHostName,
        args2?: FluentEqualToValidatorConfig | string | null,
        args3?: string | null): IValidatorBuilder {
        return this.equalTo_common(secondValueHostName, args2, args3);
    }
    /**
     * Allows several aliases setup equalTo
     * @param secondValueHostName 
     * @param args2 
     * @param args3 
     * @returns 
     */
    protected equalTo_common(
        secondValueHostName: ValueHostName,
        args2?: FluentEqualToValidatorConfig | string | null,
        args3?: string | null): IValidatorBuilder {
        
        const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<EqualToConditionConfig>(args2, args3);
        
        const conditionBuilder = this.createConditionBuilder();
        conditionBuilder.equalTo(secondValueHostName, conditionConfig as EqualToConditionConfig);
        
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }
    /**
     * Alias for equalTo
     * @param secondValueHostName - The valueHostName containing the value for the right operand.
     * @param errorMessage 
     * @param summaryMessage 
     */
    public eq(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null, summaryMessage?: string | null): IValidatorBuilder;
    /**
     * Alias for equalTo
     * @param secondValueHostName - The valueHostName containing the value for the right operand.
     * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
     * Includes several validation parameters not available in the other overload, including severity and the errorCode.
     */
    public eq(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentEqualToValidatorConfig): IValidatorBuilder;
    public eq(
        secondValueHostName: ValueHostName,
        args2?: FluentEqualToValidatorConfig | string | null,
        args3?: string | null): IValidatorBuilder {
        return this.equalTo_common(secondValueHostName, args2, args3);
    }

    /**
     * Adds a validator that ensures the value is not equal to the specified second value.
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
     * @returns The current instance of ValidatorBuilder for method chaining.
     */
    public notEqualToValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IValidatorBuilder;
    /**
     * Adds a validator that ensures the value is not equal to the specified second value.
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
     * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
     * Includes several validation parameters not available in the other overload, including severity and the errorCode.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */    
    public notEqualToValue(
        secondValue: any,
        validatorParameters: FluentNotEqualToValueValidatorConfig): IValidatorBuilder;
    public notEqualToValue(
        secondValue: any,
        args2?: FluentNotEqualToValueValidatorConfig | null | string,
        args3?: string | null): IValidatorBuilder {
        return this.notEqualToValue_common(secondValue, args2, args3);
    }
    /**
     * Allows aliases to setup notEqualToValue
     * @param secondValue 
     * @param args2 
     * @param args3 
     * @returns 
     */
    protected notEqualToValue_common(
        secondValue: any,
        args2?: FluentNotEqualToValueValidatorConfig | null | string,
        args3?: string | null): IValidatorBuilder {
        
        const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<NotEqualToValueConditionConfig>(args2, args3);
        
        const conditionBuilder = this.createConditionBuilder();
        conditionBuilder.notEqualToValue(secondValue, conditionConfig as NotEqualToValueConditionConfig);
        
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }

    /**
     * Alias for notEqualToValue
     * @param secondValue - The value to compare against the current value.
     * @param errorMessage 
     * @param summaryMessage 
     */
    public neqValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IValidatorBuilder;
    /**
     * Alias for notEqualToValue
     * @param secondValue - The value to compare against the current value.
     * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
     * Includes several validation parameters not available in the other overload, including severity and the errorCode.
     */
    public neqValue(
        secondValue: any,
        validatorParameters: FluentNotEqualToValueValidatorConfig): IValidatorBuilder;
    public neqValue(
        secondValue: any,
        args2?: FluentNotEqualToValueValidatorConfig | null | string,
        args3?: string | null): IValidatorBuilder {
        return this.notEqualToValue_common(secondValue, args2, args3);
    }

    /**
     * Adds a validator that ensures the value is not equal to the second value host.
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
     * @returns The current instance of ValidatorBuilder for method chaining.
     */
    public notEqualTo(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null, summaryMessage?: string | null): IValidatorBuilder;
    /**
     * Adds a validator that ensures the value is not equal to the second value host.
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
     * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
     * Includes several validation parameters not available in the other overload, including severity and the errorCode.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */    
    public notEqualTo(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentNotEqualToValidatorConfig): IValidatorBuilder;
    public notEqualTo(
        secondValueHostName: ValueHostName,
        args2?: FluentNotEqualToValidatorConfig | string | null,
        args3?: string | null): IValidatorBuilder {
        return this.notEqualTo_common(secondValueHostName, args2, args3);
    }
    /**
     * Allows aliases to setup notEqualTo
     * @param secondValueHostName 
     * @param args2 
     * @param args3 
     * @returns 
     */
    protected notEqualTo_common(
        secondValueHostName: ValueHostName,
        args2?: FluentNotEqualToValidatorConfig | string | null,
        args3?: string | null): IValidatorBuilder {
        const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<NotEqualToConditionConfig>(args2, args3);
        const conditionBuilder = this.createConditionBuilder();
        conditionBuilder.notEqualTo(secondValueHostName, conditionConfig as NotEqualToConditionConfig);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }
    /**
     * Alias for notEqualTo
     * @param secondValueHostName - The valueHostName containing the value for the right operand.
     * @param errorMessage 
     * @param summaryMessage 
     */
    public neq(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null, summaryMessage?: string | null): IValidatorBuilder;
/**
 * Alias for notEqualTo
 * @param secondValueHostName - The valueHostName containing the value for the right operand.
 * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
 * Includes several validation parameters not available in the other overload, including severity and the errorCode.
 */    
    public neq(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentNotEqualToValidatorConfig): IValidatorBuilder;
    public neq(
        secondValueHostName: ValueHostName,
        args2?: FluentNotEqualToValidatorConfig | string | null,
        args3?: string | null): IValidatorBuilder {
        return this.notEqualTo_common(secondValueHostName, args2, args3);
    }

    /**
     * Adds a validator that ensures the value is less than the specified second value.
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
     * @returns The current instance of ValidatorBuilder for method chaining.
     */    
    public lessThanValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IValidatorBuilder;
    /**
     * Adds a validator that ensures the value is less than the specified second value.
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
     * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
     * Includes several validation parameters not available in the other overload, including severity and the errorCode.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */
    public lessThanValue(
        secondValue: any,
        validatorParameters: FluentLessThanValueValidatorConfig): IValidatorBuilder;
    public lessThanValue(
        secondValue: any,
        args2?: FluentLessThanValueValidatorConfig | string | null,
        args3?: string | null): IValidatorBuilder {
        return this.lessThanValue_common(secondValue, args2, args3);
    }

    /**
     * Allows aliases to setup lessThanValue
     * @param secondValue 
     * @param args2 
     * @param args3 
     * @returns 
     */
    protected lessThanValue_common(
        secondValue: any,
        args2?: FluentLessThanValueValidatorConfig | string | null,
        args3?: string | null): IValidatorBuilder {
        const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<LessThanValueConditionConfig>(args2, args3);
        const conditionBuilder = this.createConditionBuilder();
        conditionBuilder.lessThanValue(secondValue, conditionConfig as LessThanValueConditionConfig);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }

    /**
     * Alias for lessThanValue
     * @param secondValue - The value to compare against the current value.
     * @param errorMessage 
     * @param summaryMessage 
     */
    public ltValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IValidatorBuilder;
    /**
     * Alias for lessThanValue
     * @param secondValue - The value to compare against the current value.
     * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
     * Includes several validation parameters not available in the other overload, including severity and the errorCode.
     */
    public ltValue(
        secondValue: any,
        validatorParameters: FluentLessThanValueValidatorConfig): IValidatorBuilder;
    public ltValue(
        secondValue: any,
        args2?: FluentLessThanValueValidatorConfig | string | null,
        args3?: string | null): IValidatorBuilder {
        return this.lessThanValue_common(secondValue, args2, args3);
    }

    /**
     * Adds a validator that ensures the value is less than the second value host.
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
     * @returns The current instance of ValidatorBuilder for method chaining.
     */        
    public lessThan(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    /**
     * Adds a validator that ensures the value is less than the second value host.
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
     * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
     * Includes several validation parameters not available in the other overload, including severity and the errorCode.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */
    public lessThan(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentLessThanValidatorConfig): IValidatorBuilder;
    public lessThan(
        secondValueHostName: ValueHostName,
        args2?: FluentLessThanValidatorConfig | string | null,
        args3?: string | null): IValidatorBuilder {
        return this.lessThan_common(secondValueHostName, args2, args3);
    }

    /**
     * Allows aliases to setup lessThan
     * @param secondValueHostName 
     * @param args2 
     * @param args3 
     * @returns 
     */
    protected lessThan_common(
        secondValueHostName: ValueHostName,
        args2?: FluentLessThanValidatorConfig | string | null,
        args3?: string | null): IValidatorBuilder {
        const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<LessThanConditionConfig>(args2, args3);
        const conditionBuilder = this.createConditionBuilder();
        conditionBuilder.lessThan(secondValueHostName, conditionConfig as LessThanConditionConfig);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }

    /**
     * Alias for lessThan
     * @param secondValueHostName - The valueHostName containing the value for the right operand.
     * @param errorMessage 
     * @param summaryMessage 
     */
    public lt(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    /**
     * Alias for lessThan
     * @param secondValueHostName - The valueHostName containing the value for the right operand.
     * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
     * Includes several validation parameters not available in the other overload, including severity and the errorCode.
     */
    public lt(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentLessThanValidatorConfig): IValidatorBuilder;
    public lt(
        secondValueHostName: ValueHostName,
        args2?: FluentLessThanValidatorConfig | string | null,
        args3?: string | null): IValidatorBuilder {
        return this.lessThan_common(secondValueHostName, args2, args3);
    }

    /**
     * Adds a validator that ensures the value is less than or equal to the specified second value.
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
     * @returns The current instance of ValidatorBuilder for method chaining.
     */    
    public lessThanOrEqualValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IValidatorBuilder;
    /**
     * Adds a validator that ensures the value is less than or equal to the specified second value.
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
     * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
     * Includes several validation parameters not available in the other overload, including severity and the errorCode.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */
    public lessThanOrEqualValue(
        secondValue: any,
        validatorParameters: FluentLessThanOrEqualValueValidatorConfig): IValidatorBuilder;
    public lessThanOrEqualValue(
        secondValue: any,
        arg2?: FluentLessThanOrEqualValueValidatorConfig | string | null,
        arg3?: string | null): IValidatorBuilder {
        return this.lessThanOrEqualValue_common(secondValue, arg2, arg3);
    }
    /**
     * Allows aliases to setup lessThanOrEqualValue
     * @param secondValue 
     * @param arg2 
     * @param arg3 
     * @returns 
     */
    protected lessThanOrEqualValue_common(
        secondValue: any,
        arg2?: FluentLessThanOrEqualValueValidatorConfig | string | null,
        arg3?: string | null): IValidatorBuilder {
        const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<LessThanOrEqualValueConditionConfig>(arg2, arg3);
        const conditionBuilder = this.createConditionBuilder();
        conditionBuilder.lessThanOrEqualValue(secondValue, conditionConfig as LessThanOrEqualValueConditionConfig);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }
    /**
     * Alias for lessThanOrEqualValue
     * @param secondValue - The value to compare against the current value.
     * @param errorMessage 
     * @param summaryMessage 
     */
    public lteValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IValidatorBuilder;
    /**
     * Alias for lessThanOrEqualValue
     * @param secondValue - The value to compare against the current value.
     * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
     * Includes several validation parameters not available in the other overload, including severity and the errorCode.
     */
    public lteValue(
        secondValue: any,
        validatorParameters: FluentLessThanOrEqualValueValidatorConfig): IValidatorBuilder;
    public lteValue(
        secondValue: any,
        arg2?: FluentLessThanOrEqualValueValidatorConfig | string | null,
        arg3?: string | null): IValidatorBuilder {
        return this.lessThanOrEqualValue_common(secondValue, arg2, arg3);
    }

    /**
     * Adds a validator that ensures the value is less than or equal to the second value host.
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
     * @returns The current instance of ValidatorBuilder for method chaining.
     */    
    public lessThanOrEqual(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    /**
     * Adds a validator that ensures the value is less than or equal to the second value host.
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
     * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
     * Includes several validation parameters not available in the other overload, including severity and the errorCode.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */
    public lessThanOrEqual(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentLessThanOrEqualValidatorConfig): IValidatorBuilder;
    public lessThanOrEqual(
        secondValueHostName: ValueHostName,
        arg2?: FluentLessThanOrEqualValidatorConfig | string | null,
        arg3?: string | null): IValidatorBuilder {
        return this.lessThanOrEqual_common(secondValueHostName, arg2, arg3);
    }

    /**
     * Allows aliases to setup lessThanOrEqual
     * @param secondValueHostName 
     * @param arg2 
     * @param arg3 
     * @returns 
     */
    protected lessThanOrEqual_common(
        secondValueHostName: ValueHostName,
        arg2?: FluentLessThanOrEqualValidatorConfig | string | null,
        arg3?: string | null): IValidatorBuilder {
        const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<LessThanOrEqualConditionConfig>(arg2, arg3);
        const conditionBuilder = this.createConditionBuilder();
        conditionBuilder.lessThanOrEqual(secondValueHostName, conditionConfig as LessThanOrEqualConditionConfig);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }

    /**
     * Alias for lessThanOrEqual
     * @param secondValueHostName - The valueHostName containing the value for the right operand.
     * @param errorMessage 
     * @param summaryMessage 
     */
    public lte(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    /**
     * Alias for lessThanOrEqual
     * @param secondValueHostName - The valueHostName containing the value for the right operand.
     * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
     * Includes several validation parameters not available in the other overload, including severity and the errorCode.
     */
    public lte(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentLessThanOrEqualValidatorConfig): IValidatorBuilder;
    public lte(
        secondValueHostName: ValueHostName,
        arg2?: FluentLessThanOrEqualValidatorConfig | string | null,
        arg3?: string | null): IValidatorBuilder {
        return this.lessThanOrEqual_common(secondValueHostName, arg2, arg3);
    }

    /**
     * Adds a validator that ensures the value is greater than the specified second value.
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
     * @returns The current instance of ValidatorBuilder for method chaining.
     */
    public greaterThanValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IValidatorBuilder;
    /**
     * Adds a validator that ensures the value is greater than the specified second value.
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
     * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
     * Includes several validation parameters not available in the other overload, including severity and the errorCode.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */    
    public greaterThanValue(
        secondValue: any,
        validatorParameters: FluentGreaterThanValueValidatorConfig): IValidatorBuilder;
    public greaterThanValue(
        secondValue: any,
        args2?: FluentGreaterThanValueValidatorConfig | string | null,
        args3?: string | null): IValidatorBuilder {
        return this.greaterThanValue_common(secondValue, args2, args3);
    }
    /**
     * Allows aliases to setup greaterThanValue
     * @param secondValue 
     * @param args2 
     * @param args3 
     * @returns 
     */
    protected greaterThanValue_common(
        secondValue: any,
        args2?: FluentGreaterThanValueValidatorConfig | string | null,
        args3?: string | null): IValidatorBuilder {
        const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<GreaterThanValueConditionConfig>(args2, args3);
        const conditionBuilder = this.createConditionBuilder();
        conditionBuilder.greaterThanValue(secondValue, conditionConfig as GreaterThanValueConditionConfig);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }

    /**
     * Alias for greaterThanValue
     * @param secondValue - The value to compare against the current value.
     * @param errorMessage 
     * @param summaryMessage 
     */
    public gtValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IValidatorBuilder;
    /**
     * Alias for greaterThanValue
     * @param secondValue - The value to compare against the current value.
     * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
     * Includes several validation parameters not available in the other overload, including severity and the errorCode.
     */
    public gtValue(
        secondValue: any,
        validatorParameters: FluentGreaterThanValueValidatorConfig): IValidatorBuilder;
    public gtValue(
        secondValue: any,
        args2?: FluentGreaterThanValueValidatorConfig | string | null,
        args3?: string | null): IValidatorBuilder {
        return this.greaterThanValue_common(secondValue, args2, args3);
    }

    /**
     * Adds a validator that ensures the value is greater than the second value host.
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
     * @returns The current instance of ValidatorBuilder for method chaining.
     */        
    public greaterThan(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    /**
     * Adds a validator that ensures the value is greater than the second value host.
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
     * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */
    public greaterThan(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentGreaterThanValidatorConfig): IValidatorBuilder;
    public greaterThan(
        secondValueHostName: ValueHostName,
        args2?: FluentGreaterThanValidatorConfig | string | null,
        args3?: string | null): IValidatorBuilder {
        return this.greaterThan_common(secondValueHostName, args2, args3);
    }
    /**
     * Allows aliases to setup greaterThan
     * @param secondValueHostName 
     * @param args2 
     * @param args3 
     * @returns 
     */
    protected greaterThan_common(
        secondValueHostName: ValueHostName,
        args2?: FluentGreaterThanValidatorConfig | string | null,
        args3?: string | null): IValidatorBuilder {
        const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<GreaterThanConditionConfig>(args2, args3);
        const conditionBuilder = this.createConditionBuilder();
        conditionBuilder.greaterThan(secondValueHostName, conditionConfig as GreaterThanConditionConfig);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }
    /**
     * Alias for greaterThan
     * @param secondValueHostName - The valueHostName containing the value for the right operand.
     * @param errorMessage 
     * @param summaryMessage 
     */
    public gt(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    /**
     * Alias for greaterThan
     * @param secondValueHostName - The valueHostName containing the value for the right operand.
     * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */
    public gt(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentGreaterThanValidatorConfig): IValidatorBuilder;
    public gt(
        secondValueHostName: ValueHostName,
        args2?: FluentGreaterThanValidatorConfig | string | null,
        args3?: string | null): IValidatorBuilder {
        return this.greaterThan_common(secondValueHostName, args2, args3);
    }

    /**
     * Adds a validator that ensures the value is greater than or equal to the specified second value.
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
     * @returns The current instance of ValidatorBuilder for method chaining.
     */    
    public greaterThanOrEqualValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IValidatorBuilder;
    /**
     * Adds a validator that ensures the value is greater than or equal to the specified second value.
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
     * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
     * Includes several validation parameters not available in the other overload, including severity and the errorCode.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */
    public greaterThanOrEqualValue(
        secondValue: any,
        validatorParameters: FluentGreaterThanOrEqualValueValidatorConfig): IValidatorBuilder;
    public greaterThanOrEqualValue(
        secondValue: any,
        arg2?: FluentGreaterThanOrEqualValueValidatorConfig | string | null,
        arg3?: string | null): IValidatorBuilder {
        return this.greaterThanOrEqualValue_common(secondValue, arg2, arg3);
    }
    /**
     * Allows aliases to setup greaterThanOrEqualValue
     * @param secondValue 
     * @param arg2 
     * @param arg3 
     * @returns 
     */
    protected greaterThanOrEqualValue_common(
        secondValue: any,
        arg2?: FluentGreaterThanOrEqualValueValidatorConfig | string | null,
        arg3?: string | null): IValidatorBuilder {
        const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<GreaterThanOrEqualValueConditionConfig>(arg2, arg3);
        const conditionBuilder = this.createConditionBuilder();
        conditionBuilder.greaterThanOrEqualValue(secondValue, conditionConfig as GreaterThanOrEqualValueConditionConfig);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }

    /**
     * Alias for greaterThanOrEqualValue
     * @param secondValue - The value to compare against the current value.
     * @param errorMessage 
     * @param summaryMessage 
     */
    public gteValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IValidatorBuilder;
    /**
     * Alias for greaterThanOrEqualValue
     * @param secondValue - The value to compare against the current value.
     * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
     * Includes several validation parameters not available in the other overload, including severity and the errorCode.
     */
    public gteValue(
        secondValue: any,
        validatorParameters: FluentGreaterThanOrEqualValueValidatorConfig): IValidatorBuilder;
    public gteValue(
        secondValue: any,
        arg2?: FluentGreaterThanOrEqualValueValidatorConfig | string | null,
        arg3?: string | null): IValidatorBuilder {
        return this.greaterThanOrEqualValue_common(secondValue, arg2, arg3);
    }

    /**
     * Adds a validator that ensures the value is greater than or equal to the second value host.
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
     * @returns The current instance of ValidatorBuilder for method chaining.
     */    
    public greaterThanOrEqual(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    /**
     * Adds a validator that ensures the value is greater than or equal to the second value host.
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
     * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
     * Includes several validation parameters not available in the other overload, including severity and the errorCode.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */
    public greaterThanOrEqual(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentGreaterThanOrEqualValidatorConfig): IValidatorBuilder;
    public greaterThanOrEqual(
        secondValueHostName: ValueHostName,
        arg2?: FluentGreaterThanOrEqualValidatorConfig | string | null,
        arg3?: string | null): IValidatorBuilder {
        return this.greaterThanOrEqual_common(secondValueHostName, arg2, arg3);
    }

    /**
     * Allows aliases to setup greaterThanOrEqual
     * @param secondValueHostName 
     * @param arg2 
     * @param arg3 
     * @returns 
     */
    protected greaterThanOrEqual_common(
        secondValueHostName: ValueHostName,
        arg2?: FluentGreaterThanOrEqualValidatorConfig | string | null,
        arg3?: string | null): IValidatorBuilder {
        const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<GreaterThanOrEqualConditionConfig>(arg2, arg3);
        const conditionBuilder = this.createConditionBuilder();
        conditionBuilder.greaterThanOrEqual(secondValueHostName, conditionConfig as GreaterThanOrEqualConditionConfig);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }

    /**
     * Alias for greaterThanOrEqual
     * @param secondValueHostName - The valueHostName containing the value for the right operand.
     * @param errorMessage 
     * @param summaryMessage 
     */
    public gte(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    /**
     * Alias for greaterThanOrEqual
     * @param secondValueHostName - The valueHostName containing the value for the right operand.
     * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
     * Includes several validation parameters not available in the other overload, including severity and the errorCode.
     */
    public gte(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentGreaterThanOrEqualValidatorConfig): IValidatorBuilder;
    public gte(
        secondValueHostName: ValueHostName,
        arg2?: FluentGreaterThanOrEqualValidatorConfig | string | null,
        arg3?: string | null): IValidatorBuilder {
        return this.greaterThanOrEqual_common(secondValueHostName, arg2, arg3);
    }

    /**
     * Adds a validator that ensures the text length is within limits.
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
     * @returns The current instance of ValidatorBuilder for method chaining.
     */    
    public stringLength(
        maximum: number | null,
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    /**
     * Adds a validator that ensures the text length is within limits.
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
     * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
     * Includes several validation parameters not available in the other overload, including severity and the errorCode.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */
    public stringLength(
        maximum: number | null,
        validatorParameters: FluentStringLengthValidatorConfig): IValidatorBuilder;
    public stringLength(
        maximum: number | null,
        arg2?: FluentStringLengthValidatorConfig | string | null,
        arg3?: string | null): IValidatorBuilder {
        return this.stringLength_common(maximum, arg2, arg3);
    }

    /**
     * Allows for aliases to setup stringLength
     * @param maximum 
     * @param arg2 
     * @param arg3 
     * @returns 
     */
    protected stringLength_common(
        maximum: number | null,
        arg2?: FluentStringLengthValidatorConfig | string | null,
        arg3?: string | null): IValidatorBuilder {
        const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<StringLengthConditionConfig>(arg2, arg3);
        
        const conditionBuilder = this.createConditionBuilder();
        conditionBuilder.stringLength(maximum, conditionConfig as StringLengthConditionConfig);

        return this.finish(conditionBuilder, errorMessage, summaryMessage, validatorParameters);
    }
    /**
     * Alias for stringLength
     * @param maximum - The maximum length allowed for the string.
     * @param errorMessage 
     * @param summaryMessage 
     */
    public len(
        maximum: number | null,
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    /**
     * Alias for stringLength
     * @param maximum - The maximum length allowed for the string.
     * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
     * Includes several validation parameters not available in the other overload, including severity and the errorCode.
     */
    public len(
        maximum: number | null,
        validatorParameters: FluentStringLengthValidatorConfig): IValidatorBuilder;
    public len(
        maximum: number | null,
        arg2?: FluentStringLengthValidatorConfig | string | null,
        arg3?: string | null): IValidatorBuilder {
        return this.stringLength_common(maximum, arg2, arg3);
    }
    /**
     * Adds a validator that ensures the value is 0 or higher.
     * It returns Undetermined if the value is not a number.
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
     * @returns The current instance of ValidatorBuilder for method chaining.
     */    
    public positive(
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    /**
     * Adds a validator that ensures the value is 0 or higher.
     * It returns Undetermined if the value is not a number.
     * @example
     * ```ts
     * positive();
     * positive("Value must be 0 or higher.");
     * positive("Value must be 0 or higher.", "Summary message");
     * positive({
     *      errorMessage: "Value must be 0 or higher.", 
     *      summaryMessage: "Summary message" });
     * ```
     * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
     * Includes several validation parameters not available in the other overload, including severity and the errorCode.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */
    public positive(
        validatorParameters: FluentPositiveValidatorConfig): IValidatorBuilder;
    public positive(
        arg1?: FluentPositiveValidatorConfig | string | null,
        arg2?: string | null): IValidatorBuilder {
        return this.positive_common(arg1, arg2);
    }

    /**
     * Allows aliases to setup positive
     * @param arg1 
     * @param arg2 
     * @returns 
     */
    protected positive_common(
        arg1?: FluentPositiveValidatorConfig | string | null,
        arg2?: string | null): IValidatorBuilder {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<PositiveConditionConfig>(arg1, arg2);   
        const conditionBuilder = this.createConditionBuilder();
        conditionBuilder.positive();
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }    
    /**
     * Alias for positive
     * @param errorMessage 
     * @param summaryMessage 
     */
    public pos(
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    /**
     * Alias for positive
     * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
     * Includes several validation parameters not available in the other overload, including severity and the errorCode.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */
    public pos(
        validatorParameters: FluentPositiveValidatorConfig): IValidatorBuilder;
    public pos(
        arg1?: FluentPositiveValidatorConfig | string | null,
        arg2?: string | null): IValidatorBuilder {
        return this.positive_common(arg1, arg2);
    }

    /**
     * Adds a validator that ensures the value is an integer.
     * It requires a numeric value, or it evaluates as Undetermined.
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
     * @returns The current instance of ValidatorBuilder for method chaining.
     */        
    public integer(
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    /**
     * Adds a validator that ensures the value is an integer.
     * It requires a numeric value, or it evaluates as Undetermined.
     * @example
     * ```ts
     * integer();
     * integer("Value must be an integer.");
     * integer("Value must be an integer.", "Summary message");
     * integer({
     *      errorMessage: "Value must be an integer.", 
     *      summaryMessage: "Summary message" });
     * ```
     * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
     * Includes several validation parameters not available in the other overload, including severity and the errorCode.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */
    public integer(
        validatorParameters: FluentIntegerValidatorConfig): IValidatorBuilder;
    public integer(
        arg1?: FluentIntegerValidatorConfig | string | null,
        arg2?: string | null): IValidatorBuilder {
        return this.integer_common(arg1, arg2);
    }
    /**
     * Allows aliases to setup integer
     * @param arg1 
     * @param arg2 
     * @returns 
     */
    protected integer_common(
        arg1?: FluentIntegerValidatorConfig | string | null,
        arg2?: string | null): IValidatorBuilder {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<IntegerConditionConfig>(arg1, arg2);       
        const conditionBuilder = this.createConditionBuilder();
        conditionBuilder.integer();
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }

    /**
     * Alias for integer
     * @param errorMessage 
     * @param summaryMessage 
     */
    public int(
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    /**
     * Alias for integer
     * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
     * Includes several validation parameters not available in the other overload, including severity and the errorCode.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */
    public int(
        validatorParameters: FluentIntegerValidatorConfig): IValidatorBuilder;
    public int(
        arg1?: FluentIntegerValidatorConfig | string | null,
        arg2?: string | null): IValidatorBuilder {
        return this.integer_common(arg1, arg2);
    }

    /**
     * Adds a validator that ensures the number of decimal places is limited to the specified maximum.
     * The value must be a number or it will be evaluated as Undetermined.
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
     * @returns The current instance of ValidatorBuilder for method chaining.
     */        
    public maxDecimals(
        maxDecimals: number,
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    /**
     * Adds a validator that ensures the number of decimal places is limited to the specified maximum.
     * The value must be a number or it will be evaluated as Undetermined.
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
     * @param validatorParameters - All validator parameters and any optional conditionConfig parameters.
     * Includes several validation parameters not available in the other overload, including severity and the errorCode.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */
    public maxDecimals(
        maxDecimals: number,
        validatorParameters: FluentMaxDecimalsValidatorConfig): IValidatorBuilder;
    public maxDecimals(
        maxDecimals: number,
        arg2?: FluentMaxDecimalsValidatorConfig | string | null,
        arg3?: string | null): IValidatorBuilder {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<MaxDecimalsConditionConfig>(arg2, arg3); 
        const conditionBuilder = this.createConditionBuilder();
        conditionBuilder.maxDecimals(maxDecimals);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }
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
     * @returns The current instance of ValidatorBuilder for method chaining.
     */    
    public not(
        childBuilder: ConditionBuilderHandler,
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
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
     * @param validatorParameters - Optional validator configuration parameters.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */
    public not(
        childBuilder: ConditionBuilderHandler,
        validatorParameters: FluentNotValidatorConfig): IValidatorBuilder;
    public not(
        childBuilder: ConditionBuilderHandler,
        arg2?: FluentNotValidatorConfig | string | null,
        arg3?: string | null): IValidatorBuilder {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<NotConditionConfig>(arg2, arg3);
        const conditionBuilder = this.createConditionBuilder();
        conditionBuilder.not(childBuilder);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }

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
     * @returns The current instance of ValidatorBuilder for method chaining.
     */        
    public when(
        whenBuilder: ConditionBuilderHandler,
        thenBuilder: ConditionBuilderHandler,
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
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
     * @param validatorParameters - Optional validator configuration parameters.
     * Includes several validation parameters not available in the other overload, including severity and the errorCode.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */
    public when(
        whenBuilder: ConditionBuilderHandler,
        thenBuilder: ConditionBuilderHandler,
        validatorParameters: FluentWhenValidatorConfig): IValidatorBuilder;    
    public when(
        whenBuilder: ConditionBuilderHandler,
        thenBuilder: ConditionBuilderHandler,
        arg3?: FluentWhenValidatorConfig | string | null,
        arg4?: string | null): IValidatorBuilder {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<WhenConditionConfig>(arg3, arg4);
        const conditionBuilder = this.createConditionBuilder();
        conditionBuilder.when(whenBuilder, thenBuilder);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }
    
    /**
     * Builds a validator that contains child conditions, and evaluates as Match
     * when all child conditions are satisfied.
     * @example
     * ```ts
     * builder.field('fieldname').all((childrenBuilder)=>{
     *     childrenBuilder.parentValue().requireText();
     *     childrenBuilder.fieldValue('fieldname2').requireText(parameters);
     *     childrenBuilder.fieldValue('fieldname2').regExp('^[A-D]');
     *     childrenBuilder.fieldValue('fieldname3').equalTo('fieldname4');
     *     childrenBuilder.any((grandchildBuilder)=> {
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
     * @returns The current instance of ValidatorBuilder for method chaining.
     */        
    public all(
        childrenBuilder: ConditionWithChildrenBuilderHandler,
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    /**
     * Builds a validator that contains child conditions, and evaluates as Match
     * when all child conditions are satisfied.
     * @example
     * ```ts
     * builder.field('fieldname').all((childrenBuilder)=>{
     *     childrenBuilder.parentValue().requireText();
     *     childrenBuilder.fieldValue('fieldname2').requireText(parameters);
     *     childrenBuilder.fieldValue('fieldname2').regExp('^[A-D]');
     *     childrenBuilder.fieldValue('fieldname3').equalTo('fieldname4');
     *     childrenBuilder.any((grandchildBuilder)=> {
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
     * @param validatorParameters - Optional validator configuration parameters.
     * Includes several validation parameters not available in the other overload, including severity and the errorCode.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */
    public all(
        childrenBuilder: ConditionWithChildrenBuilderHandler,
        validatorParameters: FluentAllMatchValidatorConfig): IValidatorBuilder;
    public all(
        childrenBuilder: ConditionWithChildrenBuilderHandler,
        arg2?: FluentAllMatchValidatorConfig | string | null,
        arg3?: string | null): IValidatorBuilder {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<AllMatchConditionConfig>(arg2, arg3);
        const conditionBuilder = this.createConditionBuilder();
        conditionBuilder.all(childrenBuilder);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }

    /**
     * Builds a validator that contains child conditions, and evaluates as Match
     * when any of the child conditions are satisfied.
     * 
     * @example
     * ```ts
     * builder.field('fieldname').any((childrenBuilder)=>{
     *    childrenBuilder.fieldValue('fieldname3').requireText();
     *    childrenBuilder.fieldValue('fieldname4').requireText();
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
     * @returns The current instance of ValidatorBuilder for method chaining.
     */
    public any(
        childrenBuilder: ConditionWithChildrenBuilderHandler,
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    /**
     * Builds a validator that contains child conditions, and evaluates as Match
     * when any of the child conditions are satisfied.
     * 
     * @example
     * ```ts
     * builder.field('fieldname').any((childrenBuilder)=>{
     *    childrenBuilder.fieldValue('fieldname3').requireText();
     *    childrenBuilder.fieldValue('fieldname4').requireText();
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
     * @param validatorParameters - Optional validator configuration parameters.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */    
    public any(
        childrenBuilder: ConditionWithChildrenBuilderHandler,
        validatorParameters: FluentAnyMatchValidatorConfig): IValidatorBuilder;
    public any(
        childrenBuilder: ConditionWithChildrenBuilderHandler,
        arg2?: FluentAnyMatchValidatorConfig | string | null,
        arg3?: string | null): IValidatorBuilder {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<AnyMatchConditionConfig>(arg2, arg3);
        const conditionBuilder = this.createConditionBuilder();
        conditionBuilder.any(childrenBuilder);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }

    /**
     * Builds a validator that contains child conditions, and evaluates as Match
     * when a specified number of child conditions are satisfied. You supply
     * a minimum and maximum number of child conditions that must be satisfied 
     * for the validator to evaluate as a match.
     * 
     * @example
     * ```ts
     * builder.field('fieldname').countMatches(2, 4,
     * (childrenBuilder)=>{
     *    childrenBuilder.fieldValue('fieldname1').requireText();
     *    childrenBuilder.fieldValue('fieldname2').requireText();
     *    childrenBuilder.fieldValue('fieldname3').requireText();
     *    childrenBuilder.fieldValue('fieldname4').requireText();
     *    childrenBuilder.fieldValue('fieldname5').requireText();
     *    childrenBuilder.fieldValue('fieldname6').requireText();
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
     * @returns The current instance of ValidatorBuilder for method chaining.
     */            
    public countMatches(
        minimum: number | null,
        maximum: number | null,
        childrenBuilder: ConditionWithChildrenBuilderHandler,
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    /**
     * Builds a validator that contains child conditions, and evaluates as Match
     * when a specified number of child conditions are satisfied. You supply
     * a minimum and maximum number of child conditions that must be satisfied 
     * for the validator to evaluate as a match.
     * 
     * @example
     * ```ts
     * builder.field('fieldname').countMatches(2, 4,
     * (childrenBuilder)=>{
     *    childrenBuilder.fieldValue('fieldname1').requireText();
     *    childrenBuilder.fieldValue('fieldname2').requireText();
     *    childrenBuilder.fieldValue('fieldname3').requireText();
     *    childrenBuilder.fieldValue('fieldname4').requireText();
     *    childrenBuilder.fieldValue('fieldname5').requireText();
     *    childrenBuilder.fieldValue('fieldname6').requireText();
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
     * @param validatorParameters - Optional validator configuration parameters.
     * @returns The current instance of ValidatorBuilder for method chaining.
     */
    public countMatches(
        minimum: number | null,
        maximum: number | null,
        childrenBuilder: ConditionWithChildrenBuilderHandler,
        validatorParameters: FluentCountMatchesValidatorConfig): IValidatorBuilder;    
    public countMatches(
        minimum: number | null,
        maximum: number | null,
        childrenBuilder: ConditionWithChildrenBuilderHandler,
        arg4?: FluentCountMatchesValidatorConfig | string | null,
        arg5?: string | null): IValidatorBuilder {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<CountMatchesConditionConfig>(arg4, arg5);
        const conditionBuilder = this.createConditionBuilder();
        conditionBuilder.countMatches(minimum, maximum, childrenBuilder);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }

}
    


/**
 * Return result from resolveValidatorOverloadArgs() to allow for optional parameters in fluent functions.
 */
export interface FluentOverloadArgs<TConditionConfig> {
    conditionConfig?: TConditionConfig | null;
    errorMessage?: string | null;
    summaryMessage?: string | null;
    validatorParameters?: FluentValidatorConfig;
}

/**
 * The actual property names on the FluentValidatorConfig interface.
 */
const FluentValidatorConfigPropertyNames: Array<string> = [
    'validatorType',
    'errorCode',
    'enabled',
    'conditionConfig', // not in the official FluentValidatorConfig, but its a typical property of ValidatorConfig
    'conditionCreator', // ditto
    'severity',
    'errorMessage',
    'summaryMessage',
    'errorMessagel10n',
    'summaryMessagel10n'    
];



/**
 * Special value passed into CompareToValueConditionBase subclasses
 * as the secondValue in the condition configuration.
 * CompareToValueConditionBase recognizes it as a reference to another ValueHost and retrieves its value accordingly.
 * 
 * When working with the Builder, you can use the helper function `valueHost(valueHostName)` to create an instance of ResolveValueHost, making it easier to reference other ValueHosts in the condition configuration.
 * ```ts
 * builder.field('field1', LookupKey.String).equalTo(valueHost('myValueHostName'))
 * // instead of
 * builder.field('field1', LookupKey.String).equalTo(new ResolveValueHost('myValueHostName'))
 * ```
 */
export class ResolveValueHost
{
    constructor(public valueHostName: string) {}
    public getValue(valueHostsManager: IValueHostsManager): any
    {
        let vh = valueHostsManager.getValueHost(this.valueHostName);
        if (!vh)
            throw new Error(`ValueHost with name ${ this.valueHostName } not found`);
        return vh.getValue();
    }
}
/**
 * Helper function to create an instance of ResolveValueHost for referencing another 
 * ValueHost in condition configurations.
 * 
 * @param valueHostName The name of the ValueHost to reference.
 * @returns An instance of ResolveValueHost pointing to the specified ValueHost.
 */
export function valueHost(valueHostName: string): ResolveValueHost
{
    return new ResolveValueHost(valueHostName);
}