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
import { ConditionBuilder } from './ConditionBuilder_classes';
import { FluentBuilderBase, FluentValidatorConfig, IBuilderConfigHost } from './Fluent';
import {
    ConditionBuilderHandler,
    ConditionWithChildrenBuilderHandler,
    OptionalRequireTextConditionParams,
    OptionalRegExpConditionParams,
    OptionalEqualToValueConditionParams,
    OptionalEqualToConditionParams,
    OptionalNotEqualToConditionParams,
    OptionalNotEqualToValueConditionParams,
    OptionalLessThanConditionParams,
    OptionalLessThanOrEqualConditionParams,
    OptionalLessThanValueConditionParams,
    OptionalLessThanOrEqualValueConditionParams,
    OptionalGreaterThanConditionParams,
    OptionalGreaterThanOrEqualConditionParams,
    OptionalGreaterThanValueConditionParams,
    OptionalGreaterThanOrEqualValueConditionParams,
    OptionalStringLengthConditionParams,
}
from './ConditionBuilder_classes'
import { ValueHostName } from "../DataTypes/BasicTypes";
import { NotConditionConfig } from "../Conditions/NotCondition";
import { WhenConditionConfig } from "../Conditions/WhenCondition";

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

}

/**
 * Supplies Conditions and Validators the preceding FieldValueHost in a fluent chain. 
 * It is returned by ValidationManagerConfigBuilder.field() and each chained object that follows.
 * 
 * See {@link Builder/Fluent | Fluent Overview}
 */
export class FluentValidatorBuilder extends FluentBuilderBase implements IFluentValidatorBuilder {
    constructor(parentConfig: FieldValueHostConfig) {
        super();
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

    private _config?: object;

    public setConfig(config: object, options?: object): FluentValidatorBuilder {
        this._config = config;
        return this;
    }
    public getConfig(): object | undefined {
        return this._config;
    }

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
     * For any implementation of a fluent condition function that works with FluentValidationRule.
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
     * @returns The current instance of ValidatorBuilder to allow for method chaining.
     */
    protected finish(conditionBuilder: ConditionBuilder | null,
        errorMessage: string | null | undefined,
        summaryMessage: string | null | undefined,
        validatorConfig: FluentValidatorConfig | undefined | null): FluentValidatorBuilder {
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
            throw new CodingError(`ValidatorConfig must have either a conditionConfig or a conditionCreator.`);

        // prevent duplicate errorcodes
        let errorCode = resolveErrorCode(ivDesc);
        if (this.parentConfig.validatorConfigs!.find((ivConfig) => resolveErrorCode(ivConfig) === errorCode))
            throw new CodingError(`ValueHost name "${this._parentConfig.name}" with errorCode ${errorCode} already defined.`);

        this.parentConfig.validatorConfigs!.push(ivDesc as ValidatorConfig);
        return this;    // chain!
    }

    /**
     * The fluent function that allows the user to supply a conditionCreator function
     * instead of setting up a condition through a config.
     */
    public customRule(this: any, conditionCreator: (requester: ValidatorConfig) => ICondition | null,
        errorMessage?: string | null,
        summaryMessage?: string | null): FluentValidatorBuilder;
    public customRule(this: any, conditionCreator: (requester: ValidatorConfig) => ICondition | null,
        validatorParameters: FluentValidatorConfig): FluentValidatorBuilder;
    public customRule(conditionCreator: (requester: ValidatorConfig) => ICondition | null,
        arg1?: FluentValidatorConfig | string | null,
        arg2?: string | null): FluentValidatorBuilder {
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
        summaryMessage?: string | null): FluentValidatorBuilder;
    public dataTypeCheck(
        validatorParameters: FluentDataTypeCheckValidatorConfig): FluentValidatorBuilder;
    public dataTypeCheck(
        arg1?: FluentDataTypeCheckValidatorConfig | string | null,
        arg2?: string | null): FluentValidatorBuilder {
        // no ConditionConfig parameter because without conditionType and valueHostName, it will always be empty   
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<DataTypeCheckConditionConfig>(arg1, arg2);
        let conditionBuilder = new ConditionBuilder(this);
        conditionBuilder.dataTypeCheck();
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }

    /**
      * Adds a RequireText condition to the fluent validator builder.
      * RequireText ensures that the value being validated is not empty.
      * The value must be a string or it evaluates as Undetermined.
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
        summaryMessage?: string | null): FluentValidatorBuilder;
    public requireText(
        validatorParameters: FluentRequireTextValidatorConfig): FluentValidatorBuilder;
    public requireText(
        arg1?: string | null | FluentRequireTextValidatorConfig,
        arg2?: string | null): FluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<RequireTextConditionConfig>(arg1, arg2);
        let conditionBuilder = new ConditionBuilder(this);
        conditionBuilder.requireText(conditionConfig as RequireTextConditionConfig);
        
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }

    /**
     * Adds a NotNull condition to the fluent validator builder.
     * NotNull ensures that the value being validated is not null.
     * The value can be of any type.
     * This condition is useful for ensuring that required fields are not left empty.
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
        summaryMessage?: string | null): FluentValidatorBuilder;
    public notNull(
        validatorParameters: FluentNotNullValidatorConfig): FluentValidatorBuilder;
    public notNull(
        arg1?: string | null | FluentNotNullValidatorConfig,
        arg2?: string | null): FluentValidatorBuilder {
        // no ConditionConfig parameter because without conditionType and valueHostName, it will always be empty  
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<NotNullConditionConfig>(arg1, arg2);
        let conditionBuilder = new ConditionBuilder(this);
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
        summaryMessage?: string | null): FluentValidatorBuilder;
    public regExp(
        expression: string,
        ignoreCase?: boolean,
        errorMessage?: string | null,
        summaryMessage?: string | null): FluentValidatorBuilder;
    public regExp(
        expression: RegExp,
        validatorParameters: FluentRegExpValidatorConfig): FluentValidatorBuilder;
    public regExp(
        expression: string,
        ignoreCase: boolean,
        validatorParameters: FluentRegExpValidatorConfig): FluentValidatorBuilder;
    public regExp(
        expression: RegExp | string, // can be either a RegExp or a string, but if string, then ignoreCase is needed
        arg2?: string | boolean | FluentRegExpValidatorConfig | null,
        arg3?: string | null | FluentRegExpValidatorConfig,
        arg4?: string | null | FluentRegExpValidatorConfig): FluentValidatorBuilder {
        if (arg2 && typeof arg2 === 'string') { // then both arg2 and arg3 are errorMessage and summaryMessage

            // expression, error message, summary message
            let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                this.resolveOverloadArgs<RegExpConditionConfig>(arg2, arg3 as string | null);

            let conditionBuilder = new ConditionBuilder(this);
            conditionBuilder.regExp(expression, undefined, conditionConfig as RegExpConditionConfig);
            return this.finish(conditionBuilder, errorMessage, summaryMessage, validatorParameters);
        }
        else if (arg2 && typeof arg2 === 'object') { // then arg2 is validatorParameters
            // expression, validatorParameters
            let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                this.resolveOverloadArgs<RegExpConditionConfig>(arg2 as FluentRegExpValidatorConfig);
            let conditionBuilder = new ConditionBuilder(this);
            conditionBuilder.regExp(expression, undefined, conditionConfig as RegExpConditionConfig);
            return this.finish(conditionBuilder, errorMessage, summaryMessage, validatorParameters);
        }
        else if (typeof arg2 === 'boolean') { // then arg2 is ignoreCase
            let ignoreCase = arg2 as boolean;
            if (arg3 && typeof arg3 === 'string') { // then both arg3 and arg4 are errorMessage and summaryMessage
                // string expression, ignoreCase, error message, summary message
                let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                    this.resolveOverloadArgs<RegExpConditionConfig>(arg3 as string | null, arg4 as string | null);
                let conditionBuilder = new ConditionBuilder(this);
                conditionBuilder.regExp(expression, ignoreCase, conditionConfig as RegExpConditionConfig);
                return this.finish(conditionBuilder, errorMessage, summaryMessage, validatorParameters);
                        
            }
            else if (arg3 && typeof arg3 === 'object') { // then arg3 is validatorParameters
                // string expression, ignoreCase, validatorParameters
                let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                    this.resolveOverloadArgs<RegExpConditionConfig>(arg3 as FluentRegExpValidatorConfig);
                let conditionBuilder = new ConditionBuilder(this);
                conditionBuilder.regExp(expression, ignoreCase, conditionConfig as RegExpConditionConfig);
                return this.finish(conditionBuilder, errorMessage, summaryMessage, validatorParameters);
            }
            if (arg4 && typeof arg4 === 'string') { // because arg3 is null as a placeholder for errormessage
                // string expression, ignoreCase, null for error message, summary message
                let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                    this.resolveOverloadArgs<RegExpConditionConfig>(arg3 as string | null, arg4 as string);
                let conditionBuilder = new ConditionBuilder(this);
                conditionBuilder.regExp(expression, ignoreCase, conditionConfig as RegExpConditionConfig);
                return this.finish(conditionBuilder, errorMessage, summaryMessage, validatorParameters);
            }
                
            else {
                // string expression, ignoreCase
                let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                    this.resolveOverloadArgs<RegExpConditionConfig>(null, null);
                let conditionBuilder = new ConditionBuilder(this);
                conditionBuilder.regExp(expression, ignoreCase, conditionConfig as RegExpConditionConfig);
                return this.finish(conditionBuilder, errorMessage, summaryMessage, validatorParameters);
            }
        }
        else if (arg3 && typeof arg3 === 'object') { // then arg3 is validatorParameters and arg2 is likely undefined
            // expression, undefined, validatorParameters
            let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                this.resolveOverloadArgs<RegExpConditionConfig>(arg3 as FluentRegExpValidatorConfig);
            let conditionBuilder = new ConditionBuilder(this);
            conditionBuilder.regExp(expression, undefined, conditionConfig as RegExpConditionConfig);
            return this.finish(conditionBuilder, errorMessage, summaryMessage, validatorParameters);
        }
        else if (expression instanceof RegExp && arg2 == null && (typeof arg3 === 'string') && arg4 == null) { // then arg2 is error message = null and arg3 is summaryMessage and arg4 is unused
            // RegExp expression, null for error message, string for summary message
            let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                this.resolveOverloadArgs<RegExpConditionConfig>(null, arg3 as string | null);
            let conditionBuilder = new ConditionBuilder(this);
            conditionBuilder.regExp(expression, undefined, conditionConfig as RegExpConditionConfig);
            return this.finish(conditionBuilder, errorMessage, summaryMessage, validatorParameters);
        }
        else if (typeof expression === 'string' && arg3 == null && (typeof arg4 === 'string')) { // then arg2 is ignoreCase = undefined, arg3 is errorMessage = null and arg4 is summaryMessage
            // string expression, ignoreCase = undefined, errorMessage = null, summaryMessage
            let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                this.resolveOverloadArgs<RegExpConditionConfig>(null, arg4 as string | null);
            let conditionBuilder = new ConditionBuilder(this);
            conditionBuilder.regExp(expression, undefined, conditionConfig as RegExpConditionConfig);
            return this.finish(conditionBuilder, errorMessage, summaryMessage, validatorParameters);
        }
        else if (arg2 == null && (typeof arg3 === 'string' || typeof arg4 === 'string')) { // then arg2 is null, arg3 is errorMessage and arg4 is summaryMessage
            // expression, null for ignoreCase, error message or null, summary message or null
            let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                this.resolveOverloadArgs<RegExpConditionConfig>(arg3 as string | null, arg4 as string | null);
            let conditionBuilder = new ConditionBuilder(this);
            conditionBuilder.regExp(expression, undefined, conditionConfig as RegExpConditionConfig);
            return this.finish(conditionBuilder, errorMessage, summaryMessage, validatorParameters);
        }
        // fall-thru
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<RegExpConditionConfig>(null, null);
        let conditionBuilder = new ConditionBuilder(this);
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
        summaryMessage?: string | null): FluentValidatorBuilder;
    public range(
        minimum: any,
        maximum: any,
        validatorParameters: FluentRangeValidatorConfig): FluentValidatorBuilder;

    public range(
        minimum: any, maximum: any,
        arg3?: string | null | FluentRangeValidatorConfig,
        arg4?: string | null): FluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<RangeConditionConfig>(arg3, arg4);
        let conditionBuilder = new ConditionBuilder(this);
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
        errorMessage?: string | null, summaryMessage?: string | null): FluentValidatorBuilder;
    public equalToValue(
        secondValue: any,
        validatorParameters: FluentEqualToValueValidatorConfig): FluentValidatorBuilder;
    public equalToValue(
        secondValue: any,
        arg2?: FluentEqualToValueValidatorConfig | string | null,
        arg3?: string | null): FluentValidatorBuilder {
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
        arg3?: string | null): FluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<EqualToValueConditionConfig>(arg2, arg3);
        let conditionBuilder = new ConditionBuilder(this);
        conditionBuilder.equalToValue(secondValue, conditionConfig as EqualToValueConditionConfig);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }

    /**
     * Same as equalToValue
     * @param secondValue 
     * @param errorMessage 
     * @param summaryMessage 
     */
    public eqValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): FluentValidatorBuilder;
    public eqValue(
        secondValue: any,
        validatorParameters: FluentEqualToValueValidatorConfig): FluentValidatorBuilder;
    public eqValue(
        secondValue: any,
        arg2?: FluentEqualToValueValidatorConfig | string | null,
        arg3?: string | null): FluentValidatorBuilder {
        return this.equalToValue_common(secondValue, arg2, arg3)
    }

    public equalTo(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null, summaryMessage?: string | null): FluentValidatorBuilder;
    public equalTo(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentEqualToValidatorConfig): FluentValidatorBuilder;
    public equalTo(
        secondValueHostName: ValueHostName,
        args2?: FluentEqualToValidatorConfig | string | null,
        args3?: string | null): FluentValidatorBuilder {
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
        args3?: string | null): FluentValidatorBuilder {
        
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<EqualToConditionConfig>(args2, args3);
        
        let conditionBuilder = new ConditionBuilder(this);
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
        errorMessage?: string | null, summaryMessage?: string | null): FluentValidatorBuilder;
    public eq(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentEqualToValidatorConfig): FluentValidatorBuilder;
    public eq(
        secondValueHostName: ValueHostName,
        args2?: FluentEqualToValidatorConfig | string | null,
        args3?: string | null): FluentValidatorBuilder {
        return this.equalTo_common(secondValueHostName, args2, args3);
    }


    public notEqualToValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): FluentValidatorBuilder;
    public notEqualToValue(
        secondValue: any,
        validatorParameters: FluentNotEqualToValueValidatorConfig): FluentValidatorBuilder;
    public notEqualToValue(
        secondValue: any,
        args2?: FluentNotEqualToValueValidatorConfig | null | string,
        args3?: string | null): FluentValidatorBuilder {
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
        args3?: string | null): FluentValidatorBuilder {
        
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<NotEqualToValueConditionConfig>(args2, args3);
        
        let conditionBuilder = new ConditionBuilder(this);
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
        errorMessage?: string | null, summaryMessage?: string | null): FluentValidatorBuilder;
    public neqValue(
        secondValue: any,
        validatorParameters: FluentNotEqualToValueValidatorConfig): FluentValidatorBuilder;
    public neqValue(
        secondValue: any,
        args2?: FluentNotEqualToValueValidatorConfig | null | string,
        args3?: string | null): FluentValidatorBuilder {
        return this.notEqualToValue_common(secondValue, args2, args3);
    }

    public notEqualTo(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null, summaryMessage?: string | null): FluentValidatorBuilder;
    public notEqualTo(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentNotEqualToValidatorConfig): FluentValidatorBuilder;
    public notEqualTo(
        secondValueHostName: ValueHostName,
        args2?: FluentNotEqualToValidatorConfig | string | null,
        args3?: string | null): FluentValidatorBuilder {
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
        args3?: string | null): FluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<NotEqualToConditionConfig>(args2, args3);
        let conditionBuilder = new ConditionBuilder(this);
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
        errorMessage?: string | null, summaryMessage?: string | null): FluentValidatorBuilder;
    public neq(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentNotEqualToValidatorConfig): FluentValidatorBuilder;
    public neq(
        secondValueHostName: ValueHostName,
        args2?: FluentNotEqualToValidatorConfig | string | null,
        args3?: string | null): FluentValidatorBuilder {
        return this.notEqualTo_common(secondValueHostName, args2, args3);
    }

    public lessThanValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): FluentValidatorBuilder;
    public lessThanValue(
        secondValue: any,
        validatorParameters: FluentLessThanValueValidatorConfig): FluentValidatorBuilder;
    public lessThanValue(
        secondValue: any,
        args2?: FluentLessThanValueValidatorConfig | string | null,
        args3?: string | null): FluentValidatorBuilder {
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
        args3?: string | null): FluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<LessThanValueConditionConfig>(args2, args3);
        let conditionBuilder = new ConditionBuilder(this);
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
        errorMessage?: string | null, summaryMessage?: string | null): FluentValidatorBuilder;
    public ltValue(
        secondValue: any,
        validatorParameters: FluentLessThanValueValidatorConfig): FluentValidatorBuilder;
    public ltValue(
        secondValue: any,
        args2?: FluentLessThanValueValidatorConfig | string | null,
        args3?: string | null): FluentValidatorBuilder {
        return this.lessThanValue_common(secondValue, args2, args3);
    }

    public lessThan(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null,
        summaryMessage?: string | null): FluentValidatorBuilder;
    public lessThan(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentLessThanValidatorConfig): FluentValidatorBuilder;
    public lessThan(
        secondValueHostName: ValueHostName,
        args2?: FluentLessThanValidatorConfig | string | null,
        args3?: string | null): FluentValidatorBuilder {
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
        args3?: string | null): FluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<LessThanConditionConfig>(args2, args3);
        let conditionBuilder = new ConditionBuilder(this);
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
        summaryMessage?: string | null): FluentValidatorBuilder;
    public lt(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentLessThanValidatorConfig): FluentValidatorBuilder;
    public lt(
        secondValueHostName: ValueHostName,
        args2?: FluentLessThanValidatorConfig | string | null,
        args3?: string | null): FluentValidatorBuilder {
        return this.lessThan_common(secondValueHostName, args2, args3);
    }

    public lessThanOrEqualValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): FluentValidatorBuilder;
    public lessThanOrEqualValue(
        secondValue: any,
        validatorParameters: FluentLessThanOrEqualValueValidatorConfig): FluentValidatorBuilder;
    public lessThanOrEqualValue(
        secondValue: any,
        arg2?: FluentLessThanOrEqualValueValidatorConfig | string | null,
        arg3?: string | null): FluentValidatorBuilder {
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
        arg3?: string | null): FluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<LessThanOrEqualValueConditionConfig>(arg2, arg3);
        let conditionBuilder = new ConditionBuilder(this);
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
        errorMessage?: string | null, summaryMessage?: string | null): FluentValidatorBuilder;
    public lteValue(
        secondValue: any,
        validatorParameters: FluentLessThanOrEqualValueValidatorConfig): FluentValidatorBuilder;
    public lteValue(
        secondValue: any,
        arg2?: FluentLessThanOrEqualValueValidatorConfig | string | null,
        arg3?: string | null): FluentValidatorBuilder {
        return this.lessThanOrEqualValue_common(secondValue, arg2, arg3);
    }


    public lessThanOrEqual(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null,
        summaryMessage?: string | null): FluentValidatorBuilder;
    public lessThanOrEqual(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentLessThanOrEqualValidatorConfig): FluentValidatorBuilder;
    public lessThanOrEqual(
        secondValueHostName: ValueHostName,
        arg2?: FluentLessThanOrEqualValidatorConfig | string | null,
        arg3?: string | null): FluentValidatorBuilder {
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
        arg3?: string | null): FluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<LessThanOrEqualConditionConfig>(arg2, arg3);
        let conditionBuilder = new ConditionBuilder(this);
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
        summaryMessage?: string | null): FluentValidatorBuilder;
    public lte(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentLessThanOrEqualValidatorConfig): FluentValidatorBuilder;
    public lte(
        secondValueHostName: ValueHostName,
        arg2?: FluentLessThanOrEqualValidatorConfig | string | null,
        arg3?: string | null): FluentValidatorBuilder {
        return this.lessThanOrEqual_common(secondValueHostName, arg2, arg3);
    }


    public greaterThanValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): FluentValidatorBuilder;
    public greaterThanValue(
        secondValue: any,
        validatorParameters: FluentGreaterThanValueValidatorConfig): FluentValidatorBuilder;
    public greaterThanValue(
        secondValue: any,
        args2?: FluentGreaterThanValueValidatorConfig | string | null,
        args3?: string | null): FluentValidatorBuilder {
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
        args3?: string | null): FluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<GreaterThanValueConditionConfig>(args2, args3);
        let conditionBuilder = new ConditionBuilder(this);
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
        errorMessage?: string | null, summaryMessage?: string | null): FluentValidatorBuilder;
    public gtValue(
        secondValue: any,
        validatorParameters: FluentGreaterThanValueValidatorConfig): FluentValidatorBuilder;
    public gtValue(
        secondValue: any,
        args2?: FluentGreaterThanValueValidatorConfig | string | null,
        args3?: string | null): FluentValidatorBuilder {
        return this.greaterThanValue_common(secondValue, args2, args3);
    }

    public greaterThan(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null,
        summaryMessage?: string | null): FluentValidatorBuilder;
    public greaterThan(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentGreaterThanValidatorConfig): FluentValidatorBuilder;
    public greaterThan(
        secondValueHostName: ValueHostName,
        args2?: FluentGreaterThanValidatorConfig | string | null,
        args3?: string | null): FluentValidatorBuilder {
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
        args3?: string | null): FluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<GreaterThanConditionConfig>(args2, args3);
        let conditionBuilder = new ConditionBuilder(this);
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
        summaryMessage?: string | null): FluentValidatorBuilder;
    public gt(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentGreaterThanValidatorConfig): FluentValidatorBuilder;
    public gt(
        secondValueHostName: ValueHostName,
        args2?: FluentGreaterThanValidatorConfig | string | null,
        args3?: string | null): FluentValidatorBuilder {
        return this.greaterThan_common(secondValueHostName, args2, args3);
    }

    public greaterThanOrEqualValue(
        secondValue: any,
        errorMessage?: string | null, summaryMessage?: string | null): FluentValidatorBuilder;
    public greaterThanOrEqualValue(
        secondValue: any,
        validatorParameters: FluentGreaterThanOrEqualValueValidatorConfig): FluentValidatorBuilder;
    public greaterThanOrEqualValue(
        secondValue: any,
        arg2?: FluentGreaterThanOrEqualValueValidatorConfig | string | null,
        arg3?: string | null): FluentValidatorBuilder {
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
        arg3?: string | null): FluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<GreaterThanOrEqualValueConditionConfig>(arg2, arg3);
        let conditionBuilder = new ConditionBuilder(this);
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
        errorMessage?: string | null, summaryMessage?: string | null): FluentValidatorBuilder;
    public gteValue(
        secondValue: any,
        validatorParameters: FluentGreaterThanOrEqualValueValidatorConfig): FluentValidatorBuilder;
    public gteValue(
        secondValue: any,
        arg2?: FluentGreaterThanOrEqualValueValidatorConfig | string | null,
        arg3?: string | null): FluentValidatorBuilder {
        return this.greaterThanOrEqualValue_common(secondValue, arg2, arg3);
    }


    public greaterThanOrEqual(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null,
        summaryMessage?: string | null): FluentValidatorBuilder;
    public greaterThanOrEqual(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentGreaterThanOrEqualValidatorConfig): FluentValidatorBuilder;
    public greaterThanOrEqual(
        secondValueHostName: ValueHostName,
        arg2?: FluentGreaterThanOrEqualValidatorConfig | string | null,
        arg3?: string | null): FluentValidatorBuilder {
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
        arg3?: string | null): FluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<GreaterThanOrEqualConditionConfig>(arg2, arg3);
        let conditionBuilder = new ConditionBuilder(this);
        conditionBuilder.greaterThanOrEqual(secondValueHostName, conditionConfig as GreaterThanOrEqualConditionConfig);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }

    public gte(
        secondValueHostName: ValueHostName,
        errorMessage?: string | null,
        summaryMessage?: string | null): FluentValidatorBuilder;
    public gte(
        secondValueHostName: ValueHostName,
        validatorParameters: FluentGreaterThanOrEqualValidatorConfig): FluentValidatorBuilder;
    public gte(
        secondValueHostName: ValueHostName,
        arg2?: FluentGreaterThanOrEqualValidatorConfig | string | null,
        arg3?: string | null): FluentValidatorBuilder {
        return this.greaterThanOrEqual_common(secondValueHostName, arg2, arg3);
    }


    public stringLength(
        maximum: number | null,
        errorMessage?: string | null,
        summaryMessage?: string | null): FluentValidatorBuilder;
    public stringLength(
        maximum: number | null,
        validatorParameters: FluentStringLengthValidatorConfig): FluentValidatorBuilder;
    public stringLength(
        maximum: number | null,
        arg2?: FluentStringLengthValidatorConfig | string | null,
        arg3?: string | null): FluentValidatorBuilder {
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
        arg3?: string | null): FluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<StringLengthConditionConfig>(arg2, arg3);
        
        let conditionBuilder = new ConditionBuilder(this);
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
        summaryMessage?: string | null): FluentValidatorBuilder;
    public len(
        maximum: number | null,
        validatorParameters: FluentStringLengthValidatorConfig): FluentValidatorBuilder;
    public len(
        maximum: number | null,
        arg2?: FluentStringLengthValidatorConfig | string | null,
        arg3?: string | null): FluentValidatorBuilder {
        return this.stringLength_common(maximum, arg2, arg3);
    }

    public positive(
        errorMessage?: string | null,
        summaryMessage?: string | null): FluentValidatorBuilder;
    public positive(
        validatorParameters: FluentPositiveValidatorConfig): FluentValidatorBuilder;
    public positive(
        arg1?: FluentPositiveValidatorConfig | string | null,
        arg2?: string | null): FluentValidatorBuilder {
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
        arg2?: string | null): FluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<PositiveConditionConfig>(arg1, arg2);   
        let conditionBuilder = new ConditionBuilder(this);
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
        summaryMessage?: string | null): FluentValidatorBuilder;
    public pos(
        validatorParameters: FluentPositiveValidatorConfig): FluentValidatorBuilder;
    public pos(
        arg1?: FluentPositiveValidatorConfig | string | null,
        arg2?: string | null): FluentValidatorBuilder {
        return this.positive_common(arg1, arg2);
    }

    public integer(
        errorMessage?: string | null,
        summaryMessage?: string | null): FluentValidatorBuilder;
    public integer(
        validatorParameters: FluentIntegerValidatorConfig): FluentValidatorBuilder;
    public integer(
        arg1?: FluentIntegerValidatorConfig | string | null,
        arg2?: string | null): FluentValidatorBuilder {
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
        arg2?: string | null): FluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<IntegerConditionConfig>(arg1, arg2);       
        let conditionBuilder = new ConditionBuilder(this);
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
        summaryMessage?: string | null): FluentValidatorBuilder;
    public int(
        validatorParameters: FluentIntegerValidatorConfig): FluentValidatorBuilder;
    public int(
        arg1?: FluentIntegerValidatorConfig | string | null,
        arg2?: string | null): FluentValidatorBuilder {
        return this.integer_common(arg1, arg2);
    }

    public maxDecimals(
        maxDecimals: number,
        errorMessage?: string | null,
        summaryMessage?: string | null): FluentValidatorBuilder;
    public maxDecimals(
        maxDecimals: number,
        validatorParameters: FluentMaxDecimalsValidatorConfig): FluentValidatorBuilder;
    public maxDecimals(
        maxDecimals: number,
        arg2?: FluentMaxDecimalsValidatorConfig | string | null,
        arg3?: string | null): FluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<MaxDecimalsConditionConfig>(arg2, arg3); 
        let conditionBuilder = new ConditionBuilder(this);
        conditionBuilder.maxDecimals(maxDecimals);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }

    public not(
        childBuilder: ConditionBuilderHandler,
        errorMessage?: string | null,
        summaryMessage?: string | null): FluentValidatorBuilder;
    public not(
        childBuilder: ConditionBuilderHandler,
        validatorParameters: FluentNotValidatorConfig): FluentValidatorBuilder;
    public not(
        childBuilder: ConditionBuilderHandler,
        arg2?: FluentNotValidatorConfig | string | null,
        arg3?: string | null): FluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<NotConditionConfig>(arg2, arg3);
        let conditionBuilder = new ConditionBuilder(this);
        conditionBuilder.not(childBuilder);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }

    public when(
        whenBuilder: ConditionBuilderHandler,
        thenBuilder: ConditionBuilderHandler,
        errorMessage?: string | null,
        summaryMessage?: string | null): FluentValidatorBuilder;
    public when(
        whenBuilder: ConditionBuilderHandler,
        thenBuilder: ConditionBuilderHandler,
        validatorParameters: FluentWhenValidatorConfig): FluentValidatorBuilder;    
    public when(
        whenBuilder: ConditionBuilderHandler,
        thenBuilder: ConditionBuilderHandler,
        arg3?: FluentWhenValidatorConfig | string | null,
        arg4?: string | null): FluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<WhenConditionConfig>(arg3, arg4);
        let conditionBuilder = new ConditionBuilder(this);
        conditionBuilder.when(whenBuilder, thenBuilder);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }
    
    public all(
        conditionsBuilder: ConditionWithChildrenBuilderHandler,
        errorMessage?: string | null,
        summaryMessage?: string | null): FluentValidatorBuilder;
    public all(
        conditionsBuilder: ConditionWithChildrenBuilderHandler,
        validatorParameters: FluentAllMatchValidatorConfig): FluentValidatorBuilder;
    public all(
        conditionsBuilder: ConditionWithChildrenBuilderHandler,
        arg2?: FluentAllMatchValidatorConfig | string | null,
        arg3?: string | null): FluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<AllMatchConditionConfig>(arg2, arg3);
        let conditionBuilder = new ConditionBuilder(this);
        conditionBuilder.all(conditionsBuilder);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }

    public any(
        conditionsBuilder: ConditionWithChildrenBuilderHandler,
        errorMessage?: string | null,
        summaryMessage?: string | null): FluentValidatorBuilder;
    public any(
        conditionsBuilder: ConditionWithChildrenBuilderHandler,
        validatorParameters: FluentAnyMatchValidatorConfig): FluentValidatorBuilder;
    public any(
        conditionsBuilder: ConditionWithChildrenBuilderHandler,
        arg2?: FluentAnyMatchValidatorConfig | string | null,
        arg3?: string | null): FluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<AnyMatchConditionConfig>(arg2, arg3);
        let conditionBuilder = new ConditionBuilder(this);
        conditionBuilder.any(conditionsBuilder);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }
    public countMatches(
        minimum: number | null,
        maximum: number | null,
        conditionsBuilder: ConditionWithChildrenBuilderHandler,
        errorMessage?: string | null,
        summaryMessage?: string | null): FluentValidatorBuilder;
    public countMatches(
        minimum: number | null,
        maximum: number | null,
        conditionsBuilder: ConditionWithChildrenBuilderHandler,
        validatorParameters: FluentCountMatchesValidatorConfig): FluentValidatorBuilder;    
    public countMatches(
        minimum: number | null,
        maximum: number | null,
        conditionsBuilder: ConditionWithChildrenBuilderHandler,
        arg4?: FluentCountMatchesValidatorConfig | string | null,
        arg5?: string | null): FluentValidatorBuilder {
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<CountMatchesConditionConfig>(arg4, arg5);
        let conditionBuilder = new ConditionBuilder(this);
        conditionBuilder.countMatches(minimum, maximum, conditionsBuilder);
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }

}
    


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
