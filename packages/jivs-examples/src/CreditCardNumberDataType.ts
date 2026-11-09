// Introduces a data type for credit card numbers.
// This file provides:
// - 'CreditCardNumber' data type lookup key.
// - 'CreditCardNumberCondition' for validating credit card numbers. See below.
// - 'CreditCardNumberConditionBuilder' and 'CreditCardNumberValidatorBuilder' for fluent syntax support.
// - Registration of the new classes with JivsServices including automatic
//   DataTypeCheck using CreditCardNumberCondition.
// - CreditCardNumberParser for credit card numbers for 'CreditCard' lookup key.
// The Condition class will handle several aspects of a credit card number.
// - Luhn's algorithm for credit card number validation.
// - Optional checks for card type based on number patterns, plus length check.


import { ConditionBuilder } from '@plblum/jivs-builder/build/Builder/ConditionBuilder';
import { ValidatorBuilder } from '@plblum/jivs-builder/build/Builder/ValidatorBuilder';
import
    {
        CompleteConfigBuilderHandler,
        IBuilderConfigHost,
        IConditionBuilder,
        IValidatorBuilder
    } from '@plblum/jivs-builder/build/Interfaces/ChildBuilders';
import { FluentValidatorConfig } from '@plblum/jivs-builder/build/Interfaces/ValueHostConfigBuilders';
import { ConditionFactory } from '@plblum/jivs-engine/build/Conditions/ConditionFactory';
import { OneValueConditionBase, OneValueConditionBaseConfig } from '@plblum/jivs-engine/build/Conditions/OneValueConditionBase';
import { CleanUpStringParserBase, CleanUpStringParserOptions } from '@plblum/jivs-engine/build/DataTypes/DataTypeParserBase';
import { ConditionCategory, ConditionEvaluateResult } from '@plblum/jivs-engine/build/Interfaces/Conditions';
import { DataTypeResolution } from '@plblum/jivs-engine/build/Interfaces/DataTypes';
import { FieldValueHostConfig } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { IValueHost } from '@plblum/jivs-engine/build/Interfaces/ValueHost';
import { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';

export const CreditCardNumberConditionType = 'CreditCard';    // we'll extend Jivs ConditionType enum with this

export interface CreditCardNumberConditionConfig extends OneValueConditionBaseConfig
{
    /**
     * The set of rules that define valid credit card types for this condition.
     * If null, no credit card type restrictions will be applied.
     * The length of the string will not be checked.
     */
    creditCardTypes?: CreditCardType[];
}

export interface CreditCardType
{
    /**
     * Optional name of the credit card type (e.g., Visa, MasterCard)
     * here for easy identification of the rule.
     */
    name?: string;
    /**
     * The initial digits of the credit card number that this rule applies to.
     * It can be any length.
     */
    initialDigits: string;

    /**
     * The maximum length of the credit card number that this rule applies to.
     */
    maxLength: number;
    /**
     * The minimum length of the credit card number that this rule applies to.
     * Leave undefined if min = max.
     */
    minLength?: number;
}

/**
 * Condition requires a valid credit card number that matches Luhn's algorithm
 * and optionally one of the specified credit card types in the options.
 * This expects the native value only contains digits. Apply a parser
 * like CleanUpStringParser with:
 * {
 *     compressWhitespace: true,
 *     stripTheseCharacters: '-.'
 * }
 * If this parser finds any non-digit characters, the condition will not be able 
 * to evaluate the value correctly and will report an Undetermined result.
 * So it may help to have another validator or richer parser to ensure the value only
 * contains digits.
 */
export class CreditCardNumberCondition extends OneValueConditionBase<CreditCardNumberConditionConfig>
{
    public evaluate(valueHost: IValueHost | null, valueHostsManager: IValueHostsManager): ConditionEvaluateResult | Promise<ConditionEvaluateResult>
    {
        valueHost = this.ensurePrimaryValueHost(valueHost, valueHostsManager);
        let value = valueHost.getValue();

        if (value === null || value === undefined || value === '')
            return ConditionEvaluateResult.Undetermined;

        if (typeof value !== 'string' || /\D/.test(value))
            return ConditionEvaluateResult.Undetermined;
        // luhn check
        let sum = 0;
        let shouldDouble = false;
        for (let i = value.length - 1; i >= 0; i--)
        {
            let digit = parseInt(value.charAt(i), 10);
            if (shouldDouble)
            {
                digit *= 2;
                if (digit > 9)
                    digit -= 9;
            }
            sum += digit;
            shouldDouble = !shouldDouble;
        }
        if (sum % 10 !== 0)
            return ConditionEvaluateResult.NoMatch;
        // check credit card type if specified in the config
        if (this.config.creditCardTypes && this.config.creditCardTypes.length > 0)
        {
            let matchedType = this.config.creditCardTypes.find(type =>
                value.startsWith(type.initialDigits)
            );
            if (!matchedType)
                return ConditionEvaluateResult.NoMatch;
            if ( value.length > matchedType.maxLength ||
                (matchedType.minLength !== undefined && value.length < matchedType.minLength))
                return ConditionEvaluateResult.NoMatch;
        }

        return ConditionEvaluateResult.Match;
    }
    protected get defaultCategory(): ConditionCategory
    {
        return ConditionCategory.DataTypeCheck;
    }
}

//#region Builder syntax
// Builder: Subclass ConditionBuilder and add your condition functions.
export class CreditCardNumberConditionBuilder
    extends ConditionBuilder
{

    public creditCardNumber(): void
    {
        let config: Partial<CreditCardNumberConditionConfig> =
        {
            conditionType: CreditCardNumberConditionType
        };
        this.setConfig(config as any);
    }
}

export class CreditCardNumberValidatorBuilder
    extends ValidatorBuilder
{
    public creditCardNumber(
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    public creditCardNumber(
        validatorParameters: FluentValidatorConfig): IValidatorBuilder;
    public creditCardNumber(
        arg2?: FluentValidatorConfig | string | null,
        arg3?: string | null): IValidatorBuilder
    {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<CreditCardNumberConditionConfig>(arg2, arg3);
        let conditionBuilder = this.createConditionBuilder();
        conditionBuilder.creditCardNumber();
        return this.finish(conditionBuilder,
            errorMessage, summaryMessage, validatorParameters);
    }
}

// TypeScript Declaration Merging with ValidatorBuilder and ConditionBuilder
// This gives you intellisense and strong typing without heavy lifting
declare module '@plblum/jivs-builder/build/Interfaces/ChildBuilders'
{
    export interface IValidatorBuilder
    {
        creditCardNumber(
            errorMessage?: string | null,
            summaryMessage?: string | null): IValidatorBuilder;
        creditCardNumber(
            validatorParameters: FluentValidatorConfig): IValidatorBuilder;
    }
}
declare module '@plblum/jivs-builder/build/Interfaces/ChildBuilders'
{
    export interface IConditionBuilder
    {
        creditCardNumber(): void;
    }
}
//#endregion Builder syntax

/**
 * Converts a string containing a credit card number into a cleaned-up format containing only digits.
 * Supports: digits only, digits with any number of hyphen or space separators.
 * Reports errors on any non-supported characters.
 * 
 * If the string contains any non-digit characters after cleaning, the following will 
 * be reported as an error by the parser:
 * - Base class contains the error message: 'Invalid entry'
 * - Error code = 'ParserError'
 * - Localized will be 'ParserError_<lookupKey>_l10n'
 */
export class CreditCardNumberParser extends CleanUpStringParserBase<CleanUpStringParserOptions>
{

    constructor(supportedLookupKey: string)
    {
        super(supportedLookupKey, {
            stripTheseCharacters: ' -'  // space and hyphen
        });
    }

    protected override parseCleanedText(text: string, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string>
    {
        let result = super.parseCleanedText(text, dataTypeLookupKey, cultureId);
        if (result.errorDetails)
            return result;
        // If no error, ensure the value contains only digits
        if (/\D/.test(result.value!))
            return this.returnError();
        return result;
    }
}

// Register after you have JivsServices instance. Setup only on the JivsServices
export function registerCreditCardNumberCondition(services: IJivsServices): void
{
    let cf = services.conditionFactory as ConditionFactory;
    // or move just this line into registerDataTypeCheckGenerators() function     
    cf.register<CreditCardNumberConditionConfig>(CreditCardNumberConditionType, (config) => new CreditCardNumberCondition(config));

    // Adding custom conditions to ValidatorBuilder and ConditionBuilder
    let ff = services.buildersFactory;
    ff.setValidatorBuilderCreator((parentConfig: FieldValueHostConfig) =>
    {
        return new CreditCardNumberValidatorBuilder(services, parentConfig) as unknown as IValidatorBuilder;
    });
    ff.setConditionBuilderCreator((parentBuilder: IBuilderConfigHost<object>, completed?: CompleteConfigBuilderHandler<any>) =>
    {
        return new CreditCardNumberConditionBuilder(services, parentBuilder, completed) as unknown as IConditionBuilder;
    });

    services.dataTypeParserService.register(new CreditCardNumberParser(CreditCardNumberConditionType));

    services.dataTypeCheckGeneratorService.registerLookupKey(CreditCardNumberConditionType, [
        <CreditCardNumberConditionConfig> {
            conditionType: CreditCardNumberConditionType
        }
    ])
}
// Removed extra closing brace
