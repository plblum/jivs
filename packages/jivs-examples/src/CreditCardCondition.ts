// Example: Introduce a new Condition class, including support for fluent syntax
// Our class will handle several aspects of a credit card number.
// - Luhn's algorithm for credit card number validation.
// - Optional checks for card type based on number patterns, plus length check.
// It provides:
// - A Validator including support for our builder.
// - Registers the new condition to be the DataTypeCheckCondition for 'CreditCard' lookup key.
// - Provides a parser for credit card numbers for 'CreditCard' lookup key.

// Here are the activities for creating a Condition class.
// 1. Choose a name, usually with the suffix "Condition".
// 2. Define its ConditionType, which is a string that is different from existing ConditionTypes.
// 3. Create your Configuration object interface, inheriting from an existing Configuration.
// 4. Create your class, inheriting from an existing Condition class.
// 5. Extend the fluent syntax by subclassing our standard ValidatorBuilder
//    and ConditionBuilder
// 6. Register new classes with the JivsServices object in createJivsServices.
//    - Condition class in the JivsServices.conditionFactory
//    - IDataTypeCheckGenerator subclass in JivsServices.dataTypeCheckGeneratorService
//    - ValidatorBuilder and ConditionBuilder subclasses in
// 7. Write unit tests. See the companion file in the Tests folder.
// 8. Create a parser for credit card numbers and register it for the 'CreditCard' lookup key.

import { OneValueConditionBase, OneValueConditionBaseConfig } from '@plblum/jivs-engine/build/Conditions/OneValueConditionBase';
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import { ConditionEvaluateResult, ConditionCategory } from '@plblum/jivs-engine/build/Interfaces/Conditions';
import { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { IValueHost } from '@plblum/jivs-engine/build/Interfaces/ValueHost';
import { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { ConditionFactory } from '@plblum/jivs-engine/build/Conditions/ConditionFactory';
import { ValidatorBuilder } from '@plblum/jivs-builder/build/Builder/ValidatorBuilder';
import { ConditionBuilder } from '@plblum/jivs-builder/build/Builder/ConditionBuilder';
import { FluentValidatorConfig } from '@plblum/jivs-builder/build/Interfaces/ValueHostConfigBuilders';
import
    {
        IBuilderConfigHost, CompleteConfigBuilderHandler,
        IValidatorBuilder, IConditionBuilder
    } from '@plblum/jivs-builder/build/Interfaces/ChildBuilders';
import { FieldValueHostConfig } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { StrongPatternParserBase, DataTypeParserOptions } from '@plblum/jivs-engine/build/DataTypes/DataTypeParserBase';
import { DataTypeResolution } from '@plblum/jivs-engine/build/Interfaces/DataTypes';
import { CleanUpStringParserBase, CleanUpStringParserOptions } from '@plblum/jivs-engine/build/DataTypes/DataTypeParserBase';

export const CreditCardConditionType = 'CreditCard';    // we'll extend Jivs ConditionType enum with this

export interface CreditCardConditionConfig extends OneValueConditionBaseConfig
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
export class CreditCardCondition extends OneValueConditionBase<CreditCardConditionConfig>
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
export class CreditCardConditionBuilder
    extends ConditionBuilder
{

    public creditCard(): void
    {
        let config: Partial<CreditCardConditionConfig> =
        {
            conditionType: CreditCardConditionType
        };
        this.setConfig(config as any);
    }
}

export class CreditCardValidatorBuilder
    extends ValidatorBuilder
{
    public creditCard(
        errorMessage?: string | null,
        summaryMessage?: string | null): IValidatorBuilder;
    public creditCard(
        validatorParameters: FluentValidatorConfig): IValidatorBuilder;
    public creditCard(
        arg2?: FluentValidatorConfig | string | null,
        arg3?: string | null): IValidatorBuilder
    {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            this.resolveOverloadArgs<CreditCardConditionConfig>(arg2, arg3);
        let conditionBuilder = this.createConditionBuilder();
        conditionBuilder.creditCard();
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
        creditCard(
            errorMessage?: string | null,
            summaryMessage?: string | null): IValidatorBuilder;
        creditCard(
            validatorParameters: FluentValidatorConfig): IValidatorBuilder;
    }
}
declare module '@plblum/jivs-builder/build/Interfaces/ChildBuilders'
{
    export interface IConditionBuilder
    {
        creditCard(): void;
    }
}
//#endregion Builder syntax

/**
 * Converts a string containing a credit card number into a cleaned-up format containing only digits.
 * Reports errors on any non-digit characters, after stripping it of spaces and hyphens.
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
export function registerCreditCardCondition(services: IJivsServices): void
{
    let cf = services.conditionFactory as ConditionFactory;
    // or move just this line into registerDataTypeCheckGenerators() function     
    cf.register<CreditCardConditionConfig>(CreditCardConditionType, (config) => new CreditCardCondition(config));

    // Adding custom conditions to ValidatorBuilder and ConditionBuilder
    let ff = services.buildersFactory;
    ff.setValidatorBuilderCreator((parentConfig: FieldValueHostConfig) =>
    {
        return new CreditCardValidatorBuilder(services, parentConfig) as unknown as IValidatorBuilder;
    });
    ff.setConditionBuilderCreator((parentBuilder: IBuilderConfigHost<object>, completed?: CompleteConfigBuilderHandler<any>) =>
    {
        return new CreditCardConditionBuilder(services, parentBuilder, completed) as unknown as IConditionBuilder;
    });

    services.dataTypeParserService.register(new CreditCardNumberParser(CreditCardConditionType));

    services.dataTypeCheckGeneratorService.registerLookupKey(CreditCardConditionType, [
        <CreditCardConditionConfig> {
            conditionType: CreditCardConditionType
        }
    ])
}
// Removed extra closing brace
