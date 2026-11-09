import { createConfigBuilder } from '@plblum/jivs-builder/build/Builder/ValueHostsManagerConfigBuilder';
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import { ConditionEvaluateResult, ConditionCategory } from '@plblum/jivs-engine/build/Interfaces/Conditions';
import { ValueHostsManager } from '@plblum/jivs-engine/build/Validation/ValueHostsManager';
import {
    CreditCardNumberCondition, CreditCardNumberConditionConfig, CreditCardNumberConditionType,
    CreditCardType, registerCreditCardNumberCondition
} from '../src/CreditCardNumberDataType';
import { createMinimalJivsServices } from '../src/support';

function createCondition(creditCardTypes?: CreditCardType[]) {
    const services = createMinimalJivsServices('en');
    registerCreditCardNumberCondition(services);

    const builder = createConfigBuilder(services);
    builder.field('CardNumber', LookupKey.String);
    const valueHostsManager = new ValueHostsManager(builder.complete());
    const valueHost = valueHostsManager.getFieldValueHost('CardNumber')!;
    const config: CreditCardNumberConditionConfig = {
        conditionType: CreditCardNumberConditionType,
        valueHostName: 'CardNumber'
    };
    if (creditCardTypes !== undefined)
        config.creditCardTypes = creditCardTypes;

    return {
        condition: new CreditCardNumberCondition(config),
        valueHost,
        valueHostsManager
    };
}

// Verify a digit-only card number is checked with Luhn and configured card-type rules.
describe('CreditCardNumberCondition evaluation', () => {
    test('matches a valid Luhn number when no card-type restriction is configured', () => {
        const { condition, valueHost, valueHostsManager } = createCondition();
        valueHost.setValue('4111111111111111');

        expect(condition.evaluate(valueHost, valueHostsManager)).toBe(ConditionEvaluateResult.Match);
        expect(condition.category).toBe(ConditionCategory.DataTypeCheck);
    });

    test('matches a valid Luhn number when the configured prefix and length match', () => {
        const { condition, valueHost, valueHostsManager } = createCondition([
            { name: 'Visa demo', initialDigits: '4', minLength: 16, maxLength: 19 }
        ]);
        valueHost.setValue('4111111111111111');

        expect(condition.evaluate(valueHost, valueHostsManager)).toBe(ConditionEvaluateResult.Match);
    });

    test('accepts a card number at the configured maximum length', () => {
        const { condition, valueHost, valueHostsManager } = createCondition([
            { initialDigits: '4', minLength: 13, maxLength: 16 }
        ]);
        valueHost.setValue('4111111111111111');

        expect(condition.evaluate(valueHost, valueHostsManager)).toBe(ConditionEvaluateResult.Match);
    });

    test('does not match a number with an invalid Luhn checksum', () => {
        const { condition, valueHost, valueHostsManager } = createCondition();
        valueHost.setValue('4111111111111112');

        expect(condition.evaluate(valueHost, valueHostsManager)).toBe(ConditionEvaluateResult.NoMatch);
    });

    test('returns undetermined for missing or non-digit values', () => {
        const { condition, valueHost, valueHostsManager } = createCondition();

        for (const value of [null, undefined, '']) {
            valueHost.setValue(value);
            expect(condition.evaluate(valueHost, valueHostsManager))
                .toBe(ConditionEvaluateResult.Undetermined);
        }

        valueHost.setValue('4111x11111111111');
        expect(condition.evaluate(valueHost, valueHostsManager))
            .toBe(ConditionEvaluateResult.Undetermined);
    });

    test('returns undetermined for a non-string value', () => {
        const { condition, valueHost, valueHostsManager } = createCondition();
        valueHost.setValue(4111111111111111);

        expect(condition.evaluate(valueHost, valueHostsManager))
            .toBe(ConditionEvaluateResult.Undetermined);
    });

    test('does not match when no configured card type has the number prefix', () => {
        const { condition, valueHost, valueHostsManager } = createCondition([
            { initialDigits: '5', maxLength: 19 }
        ]);
        valueHost.setValue('4111111111111111');

        expect(condition.evaluate(valueHost, valueHostsManager)).toBe(ConditionEvaluateResult.NoMatch);
    });

    test('matches a later configured card type when its prefix matches', () => {
        const { condition, valueHost, valueHostsManager } = createCondition([
            { name: 'Other type', initialDigits: '5', maxLength: 19 },
            { name: 'Visa demo', initialDigits: '4', minLength: 16, maxLength: 16 }
        ]);
        valueHost.setValue('4111111111111111');

        expect(condition.evaluate(valueHost, valueHostsManager)).toBe(ConditionEvaluateResult.Match);
    });

    test.each([
        [{ initialDigits: '4', maxLength: 15 }, 'exceeds the maximum'],
        [{ initialDigits: '4', minLength: 17, maxLength: 19 }, 'is below the minimum']
    ])('does not match when the card number %s', (cardType, _reason) => {
        const { condition, valueHost, valueHostsManager } = createCondition([cardType]);
        valueHost.setValue('4111111111111111');

        expect(condition.evaluate(valueHost, valueHostsManager)).toBe(ConditionEvaluateResult.NoMatch);
    });

    test('does not apply card-type restrictions when the configured list is empty', () => {
        const { condition, valueHost, valueHostsManager } = createCondition([]);
        valueHost.setValue('4111111111111111');

        expect(condition.evaluate(valueHost, valueHostsManager)).toBe(ConditionEvaluateResult.Match);
    });

    test('uses the manager to find the primary value host when none is passed', () => {
        const { condition, valueHost, valueHostsManager } = createCondition();
        valueHost.setValue('4111111111111111');

        expect(condition.evaluate(null, valueHostsManager)).toBe(ConditionEvaluateResult.Match);
    });
});
