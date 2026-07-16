import {
    AllMatchConditionConfig, AnyMatchConditionConfig,
    CountMatchesConditionConfig, DataTypeCheckConditionConfig,
    EqualToConditionConfig, EqualToValueConditionConfig,
    GreaterThanConditionConfig, GreaterThanOrEqualConditionConfig,
    GreaterThanOrEqualValueConditionConfig, GreaterThanValueConditionConfig,
    IntegerConditionConfig, LessThanConditionConfig,
    LessThanOrEqualConditionConfig, LessThanOrEqualValueConditionConfig,
    LessThanValueConditionConfig, MaxDecimalsConditionConfig,
    NotEqualToConditionConfig, NotEqualToValueConditionConfig,
    NotNullConditionConfig, PositiveConditionConfig,
    RangeConditionConfig, RegExpConditionConfig,
    RequireTextConditionConfig, StringLengthConditionConfig
} from "../Conditions/ConcreteConditions";
import { ConditionConfig, ICondition } from "../Interfaces/Conditions";
import { FieldValueHostConfig } from "../Interfaces/FieldValueHost";
import { ValidatorConfig } from "../Interfaces/Validator";
import { assertNotNull, CodingError } from "../Utilities/ErrorHandling";
import { resolveErrorCode } from "../Utilities/Validation";
import { ConditionBuilder } from "./ConditionBuilder";
import { FluentValidatorConfig } from '../Interfaces/Fluent';
import {
    IBuilderConfigHost, CompleteConfigBuilderHandler, IFluentValidatorBuilder,
    IConditionBuilder, ConditionWithChildrenBuilderHandler,
    ConditionBuilderHandler, FluentAllMatchValidatorConfig,
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
    FluentStringLengthValidatorConfig, FluentWhenValidatorConfig
} from "../Interfaces/ChildBuilders";
import { ValueHostName } from "../DataTypes/BasicTypes";
import { NotConditionConfig } from "../Conditions/NotCondition";
import { WhenConditionConfig } from "../Conditions/WhenCondition";
import { IValidationServices } from "../Interfaces/ValidationServices";
import { ValidatableValueHostBaseConfig } from "../Interfaces/ValidatableValueHostBase";
import { BuilderConfigHostBase } from "./BuilderConfigHostBase";


/**
 * Supplies Conditions and Validators the preceding FieldValueHost in a fluent chain. 
 * It is returned by ValidationManagerConfigBuilder.field() and each chained object that follows.
 * 
 * See {@link Builder/Fluent | Fluent Overview}
 */
export class FluentValidatorBuilder
    extends BuilderConfigHostBase<object>
    implements IFluentValidatorBuilder {
    /**
     * Constructor
     * @param parentConfig - Config object from the parent to host this validator.
     */
    constructor(services: IValidationServices,
        parentConfig: FieldValueHostConfig,
        completed?: CompleteConfigBuilderHandler<object>) {
        super(services, null, completed);
        assertNotNull(parentConfig, 'parentConfig');
        if (!parentConfig.validatorConfigs)
            parentConfig.validatorConfigs = [];
        this._parentConfig = parentConfig;
    }

    /**
     * This is the value ultimately passed to the ValidationManager config.ValueHostConfigs.
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
     * Finishes the creation of a Validator's condition. Each condition function within this Builder
     * only has to prepare the parameters, then call this to add the condition config
     * and get back the same FluentValidatorBuilder for chaining.
     * @param conditionConfig - if null, expects validatorConfig to supply either conditionConfig
     * or conditionCreator. If your fluent function supplies stand-alone parameters that belong
     * in conditionConfig, assign them to conditionConfig.
     * @param errorMessage - optional error message. Will overwrite any from validatorConfig if
     * supplied.
     * @param summaryMessage - optional summary message. Will overwrite any from validatorConfig if
     * supplied.
     * @param validatorConfig - does not expect conditionConfig to be setup, but if it is, it
     * will be replaced when conditionConfig is not null.
     * @returns The current instance of ValidatorBuilder to allow for method chaining.
     */
    protected finish(conditionBuilder: IConditionBuilder | null,
        errorMessage: string | null | undefined,
        summaryMessage: string | null | undefined,
        validatorConfig: FluentValidatorConfig | undefined | null): IFluentValidatorBuilder {
        let ivDesc: ValidatorConfig = validatorConfig ?
            { ...validatorConfig as ValidatorConfig } :
            { conditionConfig: null };
        if (errorMessage != null)   // null or undefined
            ivDesc.errorMessage = errorMessage;
        if (summaryMessage != null)   // null or undefined
            ivDesc.summaryMessage = summaryMessage;

        if (conditionBuilder !== null) {
            let conditionConfig = conditionBuilder.getConfig();
            assertNotNull(conditionConfig);
            assertNotNull(conditionConfig?.conditionType);
            if (conditionConfig)
                ivDesc.conditionConfig = { ...conditionConfig as ConditionConfig };
        }
        else if (ivDesc.conditionCreator == null)   // null or undefined
            this.reportError(new Error(`ValidatorConfig must have either a conditionConfig or a conditionCreator.`));   // throws

        // prevent duplicate errorcodes
        let errorCode = resolveErrorCode(ivDesc);
        if (this.parentConfig.validatorConfigs!.find((ivConfig) => resolveErrorCode(ivConfig) === errorCode))
            this.reportError(new Error(`ValueHost name "${this._parentConfig.name}" with errorCode ${errorCode} already defined.`));    // throws

        this.parentConfig.validatorConfigs!.push(ivDesc as ValidatorConfig);
        return this;    // chain!
    }

    /**
     * Creates the ConditionBuilder used by each Fluent validator function
     * using the one defined in FluentFactory on ValidationServices.
     * @returns 
     */
    protected createConditionBuilder(completed?: CompleteConfigBuilderHandler<any>): IConditionBuilder
    {
        return this.services.fluentFactory.createConditionBuilder(this, completed);
    }

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
    public customRule(this: any, conditionCreator: (requester: ValidatorConfig) => ICondition | null,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    public customRule(this: any, conditionCreator: (requester: ValidatorConfig) => ICondition | null,
        validatorParameters: FluentValidatorConfig): IFluentValidatorBuilder;
    public customRule(conditionCreator: (requester: ValidatorConfig) => ICondition | null,
        arg1?: FluentValidatorConfig | string | null,
        arg2?: string | null): IFluentValidatorBuilder {
        let { conditionConfig, errorMessage, summaryMessage, validatorParameters } =
            this.resolveOverloadArgs<ConditionConfig>(arg1, arg2);
        let ivConfig: ValidatorConfig = validatorParameters ?
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
    public dataTypeCheck(
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    public dataTypeCheck(
        validatorParameters: FluentDataTypeCheckValidatorConfig): IFluentValidatorBuilder;
    public dataTypeCheck(
        arg1?: FluentDataTypeCheckValidatorConfig | string | null,
        arg2?: string | null): IFluentValidatorBuilder {
        // no ConditionConfig parameter because without conditionType and valueHostName, it will always be empty   
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<DataTypeCheckConditionConfig>(arg1, arg2);
        let conditionBuilder = this.createConditionBuilder();
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
    public requireText(
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    public requireText(
        validatorParameters: FluentRequireTextValidatorConfig): IFluentValidatorBuilder;
    public requireText(
        arg1?: string | null | FluentRequireTextValidatorConfig,
        arg2?: string | null): IFluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<RequireTextConditionConfig>(arg1, arg2);
        let conditionBuilder = this.createConditionBuilder();
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
     * @param validatorParameters 
     * Additional ways to customize the Validator, including localized error messages,
     * severity, and the enabler.
     */
    public notNull(
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    public notNull(
        validatorParameters: FluentNotNullValidatorConfig): IFluentValidatorBuilder;
    public notNull(
        arg1?: string | null | FluentNotNullValidatorConfig,
        arg2?: string | null): IFluentValidatorBuilder {
        // no ConditionConfig parameter because without conditionType and valueHostName, it will always be empty  
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<NotNullConditionConfig>(arg1, arg2);
        let conditionBuilder = this.createConditionBuilder();
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
    public regExp(
        expression: RegExp,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    public regExp(
        expression: string,
        ignoreCase?: boolean,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    public regExp(
        expression: RegExp,
        validatorParameters: FluentRegExpValidatorConfig): IFluentValidatorBuilder;
    public regExp(
        expression: string,
        ignoreCase: boolean,
        validatorParameters: FluentRegExpValidatorConfig): IFluentValidatorBuilder;
    public regExp(
        expression: RegExp | string, // can be either a RegExp or a string, but if string, then ignoreCase is needed
        arg2?: string | boolean | FluentRegExpValidatorConfig | null,
        arg3?: string | null | FluentRegExpValidatorConfig,
        arg4?: string | null | FluentRegExpValidatorConfig): IFluentValidatorBuilder {
        if (arg2 && typeof arg2 === 'string') { // then both arg2 and arg3 are errorMessage and summaryMessage

            // expression, error message, summary message
            let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                this.resolveOverloadArgs<RegExpConditionConfig>(arg2, arg3 as string | null);

            let conditionBuilder = this.createConditionBuilder();
            conditionBuilder.regExp(expression, undefined, conditionConfig as RegExpConditionConfig);
            return this.finish(conditionBuilder, errorMessage, summaryMessage, validatorParameters);
        }
        else if (arg2 && typeof arg2 === 'object') { // then arg2 is validatorParameters
            // expression, validatorParameters
            let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                this.resolveOverloadArgs<RegExpConditionConfig>(arg2 as FluentRegExpValidatorConfig);
            let conditionBuilder = this.createConditionBuilder();
            conditionBuilder.regExp(expression, undefined, conditionConfig as RegExpConditionConfig);
            return this.finish(conditionBuilder, errorMessage, summaryMessage, validatorParameters);
        }
        else if (typeof arg2 === 'boolean') { // then arg2 is ignoreCase
            let ignoreCase = arg2 as boolean;
            if (arg3 && typeof arg3 === 'string') { // then both arg3 and arg4 are errorMessage and summaryMessage
                // string expression, ignoreCase, error message, summary message
                let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                    this.resolveOverloadArgs<RegExpConditionConfig>(arg3 as string | null, arg4 as string | null);
                let conditionBuilder = this.createConditionBuilder();
                conditionBuilder.regExp(expression, ignoreCase, conditionConfig as RegExpConditionConfig);
                return this.finish(conditionBuilder, errorMessage, summaryMessage, validatorParameters);
                        
            }
            else if (arg3 && typeof arg3 === 'object') { // then arg3 is validatorParameters
                // string expression, ignoreCase, validatorParameters
                let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                    this.resolveOverloadArgs<RegExpConditionConfig>(arg3 as FluentRegExpValidatorConfig);
                let conditionBuilder = this.createConditionBuilder();
                conditionBuilder.regExp(expression, ignoreCase, conditionConfig as RegExpConditionConfig);
                return this.finish(conditionBuilder, errorMessage, summaryMessage, validatorParameters);
            }
            if (arg4 && typeof arg4 === 'string') { // because arg3 is null as a placeholder for errormessage
                // string expression, ignoreCase, null for error message, summary message
                let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                    this.resolveOverloadArgs<RegExpConditionConfig>(arg3 as string | null, arg4 as string);
                let conditionBuilder = this.createConditionBuilder();
                conditionBuilder.regExp(expression, ignoreCase, conditionConfig as RegExpConditionConfig);
                return this.finish(conditionBuilder, errorMessage, summaryMessage, validatorParameters);
            }
                
            else {
                // string expression, ignoreCase
                let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                    this.resolveOverloadArgs<RegExpConditionConfig>(null, null);
                let conditionBuilder = this.createConditionBuilder();
                conditionBuilder.regExp(expression, ignoreCase, conditionConfig as RegExpConditionConfig);
                return this.finish(conditionBuilder, errorMessage, summaryMessage, validatorParameters);
            }
        }
        else if (arg3 && typeof arg3 === 'object') { // then arg3 is validatorParameters and arg2 is likely undefined
            // expression, undefined, validatorParameters
            let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                this.resolveOverloadArgs<RegExpConditionConfig>(arg3 as FluentRegExpValidatorConfig);
            let conditionBuilder = this.createConditionBuilder();
            conditionBuilder.regExp(expression, undefined, conditionConfig as RegExpConditionConfig);
            return this.finish(conditionBuilder, errorMessage, summaryMessage, validatorParameters);
        }
        else if (expression instanceof RegExp && arg2 == null && (typeof arg3 === 'string') && arg4 == null) { // then arg2 is error message = null and arg3 is summaryMessage and arg4 is unused
            // RegExp expression, null for error message, string for summary message
            let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                this.resolveOverloadArgs<RegExpConditionConfig>(null, arg3 as string | null);
            let conditionBuilder = this.createConditionBuilder();
            conditionBuilder.regExp(expression, undefined, conditionConfig as RegExpConditionConfig);
            return this.finish(conditionBuilder, errorMessage, summaryMessage, validatorParameters);
        }
        else if (typeof expression === 'string' && arg3 == null && (typeof arg4 === 'string')) { // then arg2 is ignoreCase = undefined, arg3 is errorMessage = null and arg4 is summaryMessage
            // string expression, ignoreCase = undefined, errorMessage = null, summaryMessage
            let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                this.resolveOverloadArgs<RegExpConditionConfig>(null, arg4 as string | null);
            let conditionBuilder = this.createConditionBuilder();
            conditionBuilder.regExp(expression, undefined, conditionConfig as RegExpConditionConfig);
            return this.finish(conditionBuilder, errorMessage, summaryMessage, validatorParameters);
        }
        else if (arg2 == null && (typeof arg3 === 'string' || typeof arg4 === 'string')) { // then arg2 is null, arg3 is errorMessage and arg4 is summaryMessage
            // expression, null for ignoreCase, error message or null, summary message or null
            let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                this.resolveOverloadArgs<RegExpConditionConfig>(arg3 as string | null, arg4 as string | null);
            let conditionBuilder = this.createConditionBuilder();
            conditionBuilder.regExp(expression, undefined, conditionConfig as RegExpConditionConfig);
            return this.finish(conditionBuilder, errorMessage, summaryMessage, validatorParameters);
        }
        // fall-thru
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<RegExpConditionConfig>(null, null);
        let conditionBuilder = this.createConditionBuilder();
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
     * @param validatorParameters 
     * Additional ways to customize the Validator, including localized error messages,
     * severity, and the enabler.
     */
    public range(
        minimum: any,
        maximum: any,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    public range(
        minimum: any,
        maximum: any,
        validatorParameters: FluentRangeValidatorConfig): IFluentValidatorBuilder;

    public range(
        minimum: any, maximum: any,
        arg3?: string | null | FluentRangeValidatorConfig,
        arg4?: string | null): IFluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<RangeConditionConfig>(arg3, arg4);
        let conditionBuilder = this.createConditionBuilder();
        conditionBuilder.range(minimum, maximum);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }

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
    public equalToValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IFluentValidatorBuilder;
    public equalToValue(
        secondValue: any,
        validatorParameters: FluentEqualToValueValidatorConfig): IFluentValidatorBuilder;
    public equalToValue(
        secondValue: any,
        arg2?: FluentEqualToValueValidatorConfig | string | null,
        arg3?: string | null): IFluentValidatorBuilder {
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
        arg3?: string | null): IFluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<EqualToValueConditionConfig>(arg2, arg3);
        let conditionBuilder = this.createConditionBuilder();
        conditionBuilder.equalToValue(secondValue, conditionConfig as EqualToValueConditionConfig);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }

    /**
     * Alias for equalToValue
     * @param secondValue 
     * @param errorMessage 
     * @param summaryMessage 
     */
    public eqValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IFluentValidatorBuilder;
    public eqValue(
        secondValue: any,
        validatorParameters: FluentEqualToValueValidatorConfig): IFluentValidatorBuilder;
    public eqValue(
        secondValue: any,
        arg2?: FluentEqualToValueValidatorConfig | string | null,
        arg3?: string | null): IFluentValidatorBuilder {
        return this.equalToValue_common(secondValue, arg2, arg3)
    }

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
    public equalTo(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null, summaryMessage?: string | null): IFluentValidatorBuilder;
    public equalTo(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentEqualToValidatorConfig): IFluentValidatorBuilder;
    public equalTo(
        secondValueHostName: ValueHostName,
        args2?: FluentEqualToValidatorConfig | string | null,
        args3?: string | null): IFluentValidatorBuilder {
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
        args3?: string | null): IFluentValidatorBuilder {
        
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<EqualToConditionConfig>(args2, args3);
        
        let conditionBuilder = this.createConditionBuilder();
        conditionBuilder.equalTo(secondValueHostName, conditionConfig as EqualToConditionConfig);
        
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }
    /**
     * Alias for equalTo
     * @param secondValueHostName 
     * @param errorMessage 
     * @param summaryMessage 
     */
    public eq(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null, summaryMessage?: string | null): IFluentValidatorBuilder;
    public eq(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentEqualToValidatorConfig): IFluentValidatorBuilder;
    public eq(
        secondValueHostName: ValueHostName,
        args2?: FluentEqualToValidatorConfig | string | null,
        args3?: string | null): IFluentValidatorBuilder {
        return this.equalTo_common(secondValueHostName, args2, args3);
    }

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
    public notEqualToValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IFluentValidatorBuilder;
    public notEqualToValue(
        secondValue: any,
        validatorParameters: FluentNotEqualToValueValidatorConfig): IFluentValidatorBuilder;
    public notEqualToValue(
        secondValue: any,
        args2?: FluentNotEqualToValueValidatorConfig | null | string,
        args3?: string | null): IFluentValidatorBuilder {
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
        args3?: string | null): IFluentValidatorBuilder {
        
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<NotEqualToValueConditionConfig>(args2, args3);
        
        let conditionBuilder = this.createConditionBuilder();
        conditionBuilder.notEqualToValue(secondValue, conditionConfig as NotEqualToValueConditionConfig);
        
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }

    /**
     * Alias for notEqualToValue
     * @param secondValue 
     * @param errorMessage 
     * @param summaryMessage 
     */
    public neqValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IFluentValidatorBuilder;
    public neqValue(
        secondValue: any,
        validatorParameters: FluentNotEqualToValueValidatorConfig): IFluentValidatorBuilder;
    public neqValue(
        secondValue: any,
        args2?: FluentNotEqualToValueValidatorConfig | null | string,
        args3?: string | null): IFluentValidatorBuilder {
        return this.notEqualToValue_common(secondValue, args2, args3);
    }

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
    public notEqualTo(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null, summaryMessage?: string | null): IFluentValidatorBuilder;
    public notEqualTo(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentNotEqualToValidatorConfig): IFluentValidatorBuilder;
    public notEqualTo(
        secondValueHostName: ValueHostName,
        args2?: FluentNotEqualToValidatorConfig | string | null,
        args3?: string | null): IFluentValidatorBuilder {
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
        args3?: string | null): IFluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<NotEqualToConditionConfig>(args2, args3);
        let conditionBuilder = this.createConditionBuilder();
        conditionBuilder.notEqualTo(secondValueHostName, conditionConfig as NotEqualToConditionConfig);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }
    /**
     * Alias for notEqualTo
     * @param secondValueHostName 
     * @param errorMessage 
     * @param summaryMessage 
     */
    public neq(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null, summaryMessage?: string | null): IFluentValidatorBuilder;
    public neq(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentNotEqualToValidatorConfig): IFluentValidatorBuilder;
    public neq(
        secondValueHostName: ValueHostName,
        args2?: FluentNotEqualToValidatorConfig | string | null,
        args3?: string | null): IFluentValidatorBuilder {
        return this.notEqualTo_common(secondValueHostName, args2, args3);
    }

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
    public lessThanValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IFluentValidatorBuilder;
    public lessThanValue(
        secondValue: any,
        validatorParameters: FluentLessThanValueValidatorConfig): IFluentValidatorBuilder;
    public lessThanValue(
        secondValue: any,
        args2?: FluentLessThanValueValidatorConfig | string | null,
        args3?: string | null): IFluentValidatorBuilder {
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
        args3?: string | null): IFluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<LessThanValueConditionConfig>(args2, args3);
        let conditionBuilder = this.createConditionBuilder();
        conditionBuilder.lessThanValue(secondValue, conditionConfig as LessThanValueConditionConfig);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }

    /**
     * Alias for lessThanValue
     * @param secondValue 
     * @param errorMessage 
     * @param summaryMessage 
     */
    public ltValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IFluentValidatorBuilder;
    public ltValue(
        secondValue: any,
        validatorParameters: FluentLessThanValueValidatorConfig): IFluentValidatorBuilder;
    public ltValue(
        secondValue: any,
        args2?: FluentLessThanValueValidatorConfig | string | null,
        args3?: string | null): IFluentValidatorBuilder {
        return this.lessThanValue_common(secondValue, args2, args3);
    }

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
    public lessThan(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    public lessThan(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentLessThanValidatorConfig): IFluentValidatorBuilder;
    public lessThan(
        secondValueHostName: ValueHostName,
        args2?: FluentLessThanValidatorConfig | string | null,
        args3?: string | null): IFluentValidatorBuilder {
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
        args3?: string | null): IFluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<LessThanConditionConfig>(args2, args3);
        let conditionBuilder = this.createConditionBuilder();
        conditionBuilder.lessThan(secondValueHostName, conditionConfig as LessThanConditionConfig);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }

    /**
     * Alias for lessThan
     * @param secondValueHostName 
     * @param errorMessage 
     * @param summaryMessage 
     */
    public lt(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    public lt(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentLessThanValidatorConfig): IFluentValidatorBuilder;
    public lt(
        secondValueHostName: ValueHostName,
        args2?: FluentLessThanValidatorConfig | string | null,
        args3?: string | null): IFluentValidatorBuilder {
        return this.lessThan_common(secondValueHostName, args2, args3);
    }

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
    public lessThanOrEqualValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IFluentValidatorBuilder;
    public lessThanOrEqualValue(
        secondValue: any,
        validatorParameters: FluentLessThanOrEqualValueValidatorConfig): IFluentValidatorBuilder;
    public lessThanOrEqualValue(
        secondValue: any,
        arg2?: FluentLessThanOrEqualValueValidatorConfig | string | null,
        arg3?: string | null): IFluentValidatorBuilder {
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
        arg3?: string | null): IFluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<LessThanOrEqualValueConditionConfig>(arg2, arg3);
        let conditionBuilder = this.createConditionBuilder();
        conditionBuilder.lessThanOrEqualValue(secondValue, conditionConfig as LessThanOrEqualValueConditionConfig);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }
    /**
     * Alias for lessThanOrEqualValue
     * @param secondValue 
     * @param errorMessage 
     * @param summaryMessage 
     */
    public lteValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IFluentValidatorBuilder;
    public lteValue(
        secondValue: any,
        validatorParameters: FluentLessThanOrEqualValueValidatorConfig): IFluentValidatorBuilder;
    public lteValue(
        secondValue: any,
        arg2?: FluentLessThanOrEqualValueValidatorConfig | string | null,
        arg3?: string | null): IFluentValidatorBuilder {
        return this.lessThanOrEqualValue_common(secondValue, arg2, arg3);
    }

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
    public lessThanOrEqual(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    public lessThanOrEqual(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentLessThanOrEqualValidatorConfig): IFluentValidatorBuilder;
    public lessThanOrEqual(
        secondValueHostName: ValueHostName,
        arg2?: FluentLessThanOrEqualValidatorConfig | string | null,
        arg3?: string | null): IFluentValidatorBuilder {
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
        arg3?: string | null): IFluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<LessThanOrEqualConditionConfig>(arg2, arg3);
        let conditionBuilder = this.createConditionBuilder();
        conditionBuilder.lessThanOrEqual(secondValueHostName, conditionConfig as LessThanOrEqualConditionConfig);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }

    /**
     * Alias for lessThanOrEqual
     * @param secondValueHostName 
     * @param errorMessage 
     * @param summaryMessage 
     */
    public lte(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    public lte(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentLessThanOrEqualValidatorConfig): IFluentValidatorBuilder;
    public lte(
        secondValueHostName: ValueHostName,
        arg2?: FluentLessThanOrEqualValidatorConfig | string | null,
        arg3?: string | null): IFluentValidatorBuilder {
        return this.lessThanOrEqual_common(secondValueHostName, arg2, arg3);
    }

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
    public greaterThanValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IFluentValidatorBuilder;
    public greaterThanValue(
        secondValue: any,
        validatorParameters: FluentGreaterThanValueValidatorConfig): IFluentValidatorBuilder;
    public greaterThanValue(
        secondValue: any,
        args2?: FluentGreaterThanValueValidatorConfig | string | null,
        args3?: string | null): IFluentValidatorBuilder {
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
        args3?: string | null): IFluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<GreaterThanValueConditionConfig>(args2, args3);
        let conditionBuilder = this.createConditionBuilder();
        conditionBuilder.greaterThanValue(secondValue, conditionConfig as GreaterThanValueConditionConfig);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }

    /**
     * Alias for greaterThanValue
     * @param secondValue 
     * @param errorMessage 
     * @param summaryMessage 
     */
    public gtValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IFluentValidatorBuilder;
    public gtValue(
        secondValue: any,
        validatorParameters: FluentGreaterThanValueValidatorConfig): IFluentValidatorBuilder;
    public gtValue(
        secondValue: any,
        args2?: FluentGreaterThanValueValidatorConfig | string | null,
        args3?: string | null): IFluentValidatorBuilder {
        return this.greaterThanValue_common(secondValue, args2, args3);
    }

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
    public greaterThan(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    public greaterThan(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentGreaterThanValidatorConfig): IFluentValidatorBuilder;
    public greaterThan(
        secondValueHostName: ValueHostName,
        args2?: FluentGreaterThanValidatorConfig | string | null,
        args3?: string | null): IFluentValidatorBuilder {
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
        args3?: string | null): IFluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<GreaterThanConditionConfig>(args2, args3);
        let conditionBuilder = this.createConditionBuilder();
        conditionBuilder.greaterThan(secondValueHostName, conditionConfig as GreaterThanConditionConfig);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }
    /**
     * Alias for greaterThan
     * @param secondValueHostName 
     * @param errorMessage 
     * @param summaryMessage 
     */
    public gt(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    public gt(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentGreaterThanValidatorConfig): IFluentValidatorBuilder;
    public gt(
        secondValueHostName: ValueHostName,
        args2?: FluentGreaterThanValidatorConfig | string | null,
        args3?: string | null): IFluentValidatorBuilder {
        return this.greaterThan_common(secondValueHostName, args2, args3);
    }

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
    public greaterThanOrEqualValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IFluentValidatorBuilder;
    public greaterThanOrEqualValue(
        secondValue: any,
        validatorParameters: FluentGreaterThanOrEqualValueValidatorConfig): IFluentValidatorBuilder;
    public greaterThanOrEqualValue(
        secondValue: any,
        arg2?: FluentGreaterThanOrEqualValueValidatorConfig | string | null,
        arg3?: string | null): IFluentValidatorBuilder {
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
        arg3?: string | null): IFluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<GreaterThanOrEqualValueConditionConfig>(arg2, arg3);
        let conditionBuilder = this.createConditionBuilder();
        conditionBuilder.greaterThanOrEqualValue(secondValue, conditionConfig as GreaterThanOrEqualValueConditionConfig);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }

    /**
     * Alias for greaterThanOrEqualValue
     * @param secondValue 
     * @param errorMessage 
     * @param summaryMessage 
     */
    public gteValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): IFluentValidatorBuilder;
    public gteValue(
        secondValue: any,
        validatorParameters: FluentGreaterThanOrEqualValueValidatorConfig): IFluentValidatorBuilder;
    public gteValue(
        secondValue: any,
        arg2?: FluentGreaterThanOrEqualValueValidatorConfig | string | null,
        arg3?: string | null): IFluentValidatorBuilder {
        return this.greaterThanOrEqualValue_common(secondValue, arg2, arg3);
    }

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
    public greaterThanOrEqual(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    public greaterThanOrEqual(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentGreaterThanOrEqualValidatorConfig): IFluentValidatorBuilder;
    public greaterThanOrEqual(
        secondValueHostName: ValueHostName,
        arg2?: FluentGreaterThanOrEqualValidatorConfig | string | null,
        arg3?: string | null): IFluentValidatorBuilder {
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
        arg3?: string | null): IFluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<GreaterThanOrEqualConditionConfig>(arg2, arg3);
        let conditionBuilder = this.createConditionBuilder();
        conditionBuilder.greaterThanOrEqual(secondValueHostName, conditionConfig as GreaterThanOrEqualConditionConfig);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }

    public gte(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    public gte(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentGreaterThanOrEqualValidatorConfig): IFluentValidatorBuilder;
    public gte(
        secondValueHostName: ValueHostName,
        arg2?: FluentGreaterThanOrEqualValidatorConfig | string | null,
        arg3?: string | null): IFluentValidatorBuilder {
        return this.greaterThanOrEqual_common(secondValueHostName, arg2, arg3);
    }

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
    public stringLength(
        maximum: number | null,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    public stringLength(
        maximum: number | null,
        validatorParameters: FluentStringLengthValidatorConfig): IFluentValidatorBuilder;
    public stringLength(
        maximum: number | null,
        arg2?: FluentStringLengthValidatorConfig | string | null,
        arg3?: string | null): IFluentValidatorBuilder {
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
        arg3?: string | null): IFluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<StringLengthConditionConfig>(arg2, arg3);
        
        let conditionBuilder = this.createConditionBuilder();
        conditionBuilder.stringLength(maximum, conditionConfig as StringLengthConditionConfig);

        return this.finish(conditionBuilder, errorMessage, summaryMessage, validatorParameters);
    }
    /**
     * Alias for stringLength
     * @param maximum 
     * @param errorMessage 
     * @param summaryMessage 
     */
    public len(
        maximum: number | null,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    public len(
        maximum: number | null,
        validatorParameters: FluentStringLengthValidatorConfig): IFluentValidatorBuilder;
    public len(
        maximum: number | null,
        arg2?: FluentStringLengthValidatorConfig | string | null,
        arg3?: string | null): IFluentValidatorBuilder {
        return this.stringLength_common(maximum, arg2, arg3);
    }
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
    public positive(
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    public positive(
        validatorParameters: FluentPositiveValidatorConfig): IFluentValidatorBuilder;
    public positive(
        arg1?: FluentPositiveValidatorConfig | string | null,
        arg2?: string | null): IFluentValidatorBuilder {
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
        arg2?: string | null): IFluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<PositiveConditionConfig>(arg1, arg2);   
        let conditionBuilder = this.createConditionBuilder();
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
        summaryMessage?: string | null): IFluentValidatorBuilder;
    public pos(
        validatorParameters: FluentPositiveValidatorConfig): IFluentValidatorBuilder;
    public pos(
        arg1?: FluentPositiveValidatorConfig | string | null,
        arg2?: string | null): IFluentValidatorBuilder {
        return this.positive_common(arg1, arg2);
    }

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
    public integer(
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    public integer(
        validatorParameters: FluentIntegerValidatorConfig): IFluentValidatorBuilder;
    public integer(
        arg1?: FluentIntegerValidatorConfig | string | null,
        arg2?: string | null): IFluentValidatorBuilder {
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
        arg2?: string | null): IFluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<IntegerConditionConfig>(arg1, arg2);       
        let conditionBuilder = this.createConditionBuilder();
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
        summaryMessage?: string | null): IFluentValidatorBuilder;
    public int(
        validatorParameters: FluentIntegerValidatorConfig): IFluentValidatorBuilder;
    public int(
        arg1?: FluentIntegerValidatorConfig | string | null,
        arg2?: string | null): IFluentValidatorBuilder {
        return this.integer_common(arg1, arg2);
    }

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
    public maxDecimals(
        maxDecimals: number,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    public maxDecimals(
        maxDecimals: number,
        validatorParameters: FluentMaxDecimalsValidatorConfig): IFluentValidatorBuilder;
    public maxDecimals(
        maxDecimals: number,
        arg2?: FluentMaxDecimalsValidatorConfig | string | null,
        arg3?: string | null): IFluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<MaxDecimalsConditionConfig>(arg2, arg3); 
        let conditionBuilder = this.createConditionBuilder();
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
     * @param childBuilderHandler - The condition builder handler that defines the child condition to be negated.
     * @param errorMessage - The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * If null, it will expect to be setup by one of several other sources including
     * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
     * @param summaryMessage - optional summary message.
     * @param validatorParameters - Optional validator configuration parameters.
     * @returns The current instance of FluentValidatorBuilder for method chaining.
     */    
    public not(
        childBuilder: ConditionBuilderHandler,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    public not(
        childBuilder: ConditionBuilderHandler,
        validatorParameters: FluentNotValidatorConfig): IFluentValidatorBuilder;
    public not(
        childBuilder: ConditionBuilderHandler,
        arg2?: FluentNotValidatorConfig | string | null,
        arg3?: string | null): IFluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<NotConditionConfig>(arg2, arg3);
        let conditionBuilder = this.createConditionBuilder();
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
    public when(
        whenBuilder: ConditionBuilderHandler,
        thenBuilder: ConditionBuilderHandler,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    public when(
        whenBuilder: ConditionBuilderHandler,
        thenBuilder: ConditionBuilderHandler,
        validatorParameters: FluentWhenValidatorConfig): IFluentValidatorBuilder;    
    public when(
        whenBuilder: ConditionBuilderHandler,
        thenBuilder: ConditionBuilderHandler,
        arg3?: FluentWhenValidatorConfig | string | null,
        arg4?: string | null): IFluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<WhenConditionConfig>(arg3, arg4);
        let conditionBuilder = this.createConditionBuilder();
        conditionBuilder.when(whenBuilder, thenBuilder);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }
    
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
    public all(
        conditionsBuilder: ConditionWithChildrenBuilderHandler,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    public all(
        conditionsBuilder: ConditionWithChildrenBuilderHandler,
        validatorParameters: FluentAllMatchValidatorConfig): IFluentValidatorBuilder;
    public all(
        conditionsBuilder: ConditionWithChildrenBuilderHandler,
        arg2?: FluentAllMatchValidatorConfig | string | null,
        arg3?: string | null): IFluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<AllMatchConditionConfig>(arg2, arg3);
        let conditionBuilder = this.createConditionBuilder();
        conditionBuilder.all(conditionsBuilder);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }

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
    public any(
        conditionsBuilder: ConditionWithChildrenBuilderHandler,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    public any(
        conditionsBuilder: ConditionWithChildrenBuilderHandler,
        validatorParameters: FluentAnyMatchValidatorConfig): IFluentValidatorBuilder;
    public any(
        conditionsBuilder: ConditionWithChildrenBuilderHandler,
        arg2?: FluentAnyMatchValidatorConfig | string | null,
        arg3?: string | null): IFluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<AnyMatchConditionConfig>(arg2, arg3);
        let conditionBuilder = this.createConditionBuilder();
        conditionBuilder.any(conditionsBuilder);
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
    public countMatches(
        minimum: number | null,
        maximum: number | null,
        conditionsBuilder: ConditionWithChildrenBuilderHandler,
        errorMessage?: string | null,
        summaryMessage?: string | null): IFluentValidatorBuilder;
    public countMatches(
        minimum: number | null,
        maximum: number | null,
        conditionsBuilder: ConditionWithChildrenBuilderHandler,
        validatorParameters: FluentCountMatchesValidatorConfig): IFluentValidatorBuilder;    
    public countMatches(
        minimum: number | null,
        maximum: number | null,
        conditionsBuilder: ConditionWithChildrenBuilderHandler,
        arg4?: FluentCountMatchesValidatorConfig | string | null,
        arg5?: string | null): IFluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<CountMatchesConditionConfig>(arg4, arg5);
        let conditionBuilder = this.createConditionBuilder();
        conditionBuilder.countMatches(minimum, maximum, conditionsBuilder);
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
