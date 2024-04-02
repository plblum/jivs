import { AbbrevDOWDateFormatter, AbbrevDateFormatter, BooleanFormatter, CapitalizeStringFormatter, CurrencyFormatter, DataTypeFormatterBase, DateFormatter, DateTimeFormatter, LongDOWDateFormatter, LongDateFormatter, LowercaseStringFormatter, NumberFormatter, Percentage100Formatter, PercentageFormatter, StringFormatter, TimeofDayHMSFormatter, TimeofDayFormatter, UppercaseStringFormatter } from '../../src/DataTypes/DataTypeFormatters';
import { MockValidationServices } from '../Mocks';
import { LookupKey } from '../../src/DataTypes/LookupKeys';
describe('DataTypeFormatterBase', () => {
    class TestClass extends DataTypeFormatterBase {
        get expectedLookupKeys() {
            throw new Error('Method not implemented.');
        }
        supportsCulture(cultureId) {
            throw new Error('Method not implemented.');
        }
        format(value, dataTypeLookupKey, cultureId) {
            throw new Error('Method not implemented.');
        }
    }
    test('Services that are unassigned throw', () => {
        let testItem = new TestClass();
        let x;
        expect(() => x = testItem.services).toThrow(/Register/);
    });
    test('Services to return same ValidationService as assigned', () => {
        let services = new MockValidationServices(false, false);
        let testItem = new TestClass();
        expect(() => testItem.services = services).not.toThrow();
        expect(testItem.services).toBe(services);
    });
});
describe('StringFormatter', () => {
    test('supports', () => {
        let testItem = new StringFormatter();
        expect(testItem.supports(LookupKey.String, 'en')).toBe(true);
        expect(testItem.supports(LookupKey.String, 'fr')).toBe(true);
        expect(testItem.supports(LookupKey.Number, 'en')).toBe(false);
        expect(testItem.supports(LookupKey.Uppercase, 'en')).toBe(false);
    });
    test('en: format with string parameter', () => {
        let testItem = new StringFormatter();
        let dts = testItem.format('A', LookupKey.String, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('A');
        expect(dts.errorMessage).toBeUndefined();
    });
    test('fr: format with string parameter', () => {
        let testItem = new StringFormatter();
        let dts = testItem.format('A', LookupKey.String, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('A');
        expect(dts.errorMessage).toBeUndefined();
    });
    test('format with number parameter is converted to string', () => {
        let testItem = new StringFormatter();
        let dts = testItem.format(15, LookupKey.String, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('15');
        expect(dts.errorMessage).toBeUndefined();
    });
    test('format with null parameter returns empty string', () => {
        let testItem = new StringFormatter();
        let dts = testItem.format(null, LookupKey.String, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
        expect(dts.errorMessage).toBeUndefined();
    });
    test('format with undefined parameter returns empty string', () => {
        let testItem = new StringFormatter();
        let dts = testItem.format(undefined, LookupKey.String, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
        expect(dts.errorMessage).toBeUndefined();
    });
    test('format with object parameter is an error', () => {
        let testItem = new StringFormatter();
        let dts = testItem.format({}, LookupKey.String, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a string or primitive');
    });
});
describe('CapitalizeStringFormatter', () => {
    test('supports', () => {
        let testItem = new CapitalizeStringFormatter();
        expect(testItem.supports(LookupKey.Capitalize, 'en')).toBe(true);
        expect(testItem.supports(LookupKey.Capitalize, 'fr')).toBe(true);
        expect(testItem.supports(LookupKey.Number, 'en')).toBe(false);
        expect(testItem.supports('anythingelse', 'en')).toBe(false);
    });
    test('en: format with string parameter', () => {
        let testItem = new CapitalizeStringFormatter();
        let dts = testItem.format('A', LookupKey.Capitalize, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('A');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format('a', LookupKey.Capitalize, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('A');
        dts = testItem.format('abc', LookupKey.Capitalize, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('Abc');
        dts = testItem.format('', LookupKey.Capitalize, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
    });
    test('fr: format with string parameter', () => {
        let testItem = new CapitalizeStringFormatter();
        let dts = testItem.format('A', LookupKey.Capitalize, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('A');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format('a', LookupKey.Capitalize, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('A');
        dts = testItem.format('abc', LookupKey.Capitalize, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('Abc');
        dts = testItem.format('', LookupKey.Capitalize, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
    });
    test('format with number parameter is converted to string', () => {
        let testItem = new CapitalizeStringFormatter();
        let dts = testItem.format(15, LookupKey.Capitalize, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('15');
        expect(dts.errorMessage).toBeUndefined();
    });
    test('format with null parameter returns empty string', () => {
        let testItem = new CapitalizeStringFormatter();
        let dts = testItem.format(null, LookupKey.Capitalize, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
        expect(dts.errorMessage).toBeUndefined();
    });
    test('format with undefined parameter returns empty string', () => {
        let testItem = new CapitalizeStringFormatter();
        let dts = testItem.format(undefined, LookupKey.Capitalize, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
        expect(dts.errorMessage).toBeUndefined();
    });
    test('format with object parameter is an error', () => {
        let testItem = new CapitalizeStringFormatter();
        let dts = testItem.format({}, LookupKey.Capitalize, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a string or primitive');
    });
});
describe('UppercaseStringFormatter', () => {
    test('supports', () => {
        let testItem = new UppercaseStringFormatter();
        expect(testItem.supports(LookupKey.Uppercase, 'en')).toBe(true);
        expect(testItem.supports(LookupKey.Uppercase, 'fr')).toBe(true);
        expect(testItem.supports(LookupKey.Number, 'en')).toBe(false);
        expect(testItem.supports('anythingelse', 'en')).toBe(false);
    });
    test('en: format with string parameter', () => {
        let testItem = new UppercaseStringFormatter();
        let dts = testItem.format('A', LookupKey.Uppercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('A');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format('a', LookupKey.Uppercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('A');
        dts = testItem.format('ABC', LookupKey.Uppercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('ABC');
        dts = testItem.format('abc', LookupKey.Uppercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('ABC');
        dts = testItem.format('', LookupKey.Uppercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
    });
    test('fr: format with string parameter', () => {
        let testItem = new UppercaseStringFormatter();
        let dts = testItem.format('A', LookupKey.Uppercase, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('A');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format('a', LookupKey.Uppercase, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('A');
        dts = testItem.format('ABC', LookupKey.Uppercase, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('ABC');
        dts = testItem.format('abc', LookupKey.Uppercase, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('ABC');
        dts = testItem.format('', LookupKey.Uppercase, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
    });
    test('format with number parameter is converted to string', () => {
        let testItem = new UppercaseStringFormatter();
        let dts = testItem.format(15, LookupKey.Uppercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('15');
        expect(dts.errorMessage).toBeUndefined();
    });
    test('format with null parameter returns empty string', () => {
        let testItem = new UppercaseStringFormatter();
        let dts = testItem.format(null, LookupKey.Uppercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
        expect(dts.errorMessage).toBeUndefined();
    });
    test('format with undefined parameter returns empty string', () => {
        let testItem = new UppercaseStringFormatter();
        let dts = testItem.format(undefined, LookupKey.Uppercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
        expect(dts.errorMessage).toBeUndefined();
    });
    test('format with object parameter is an error', () => {
        let testItem = new UppercaseStringFormatter();
        let dts = testItem.format({}, LookupKey.Uppercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a string or primitive');
    });
});
describe('LowercaseStringFormatter', () => {
    test('supports', () => {
        let testItem = new LowercaseStringFormatter();
        expect(testItem.supports(LookupKey.Lowercase, 'en')).toBe(true);
        expect(testItem.supports(LookupKey.Lowercase, 'fr')).toBe(true);
        expect(testItem.supports(LookupKey.Number, 'en')).toBe(false);
        expect(testItem.supports('anythingelse', 'en')).toBe(false);
    });
    test('en: format with string parameter', () => {
        let testItem = new LowercaseStringFormatter();
        let dts = testItem.format('A', LookupKey.Lowercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('a');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format('a', LookupKey.Lowercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('a');
        dts = testItem.format('ABC', LookupKey.Lowercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('abc');
        dts = testItem.format('abc', LookupKey.Lowercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('abc');
        dts = testItem.format('', LookupKey.Lowercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
    });
    test('fr: format with string parameter', () => {
        let testItem = new LowercaseStringFormatter();
        let dts = testItem.format('A', LookupKey.Lowercase, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('a');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format('a', LookupKey.Lowercase, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('a');
        dts = testItem.format('ABC', LookupKey.Lowercase, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('abc');
        dts = testItem.format('abc', LookupKey.Lowercase, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('abc');
        dts = testItem.format('', LookupKey.Lowercase, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
    });
    test('format with number parameter is converted to string', () => {
        let testItem = new LowercaseStringFormatter();
        let dts = testItem.format(15, LookupKey.Lowercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('15');
        expect(dts.errorMessage).toBeUndefined();
    });
    test('format with null parameter returns empty string', () => {
        let testItem = new LowercaseStringFormatter();
        let dts = testItem.format(null, LookupKey.Lowercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
        expect(dts.errorMessage).toBeUndefined();
    });
    test('format with undefined parameter returns empty string', () => {
        let testItem = new LowercaseStringFormatter();
        let dts = testItem.format(undefined, LookupKey.Lowercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
        expect(dts.errorMessage).toBeUndefined();
    });
    test('format with object parameter is an error', () => {
        let testItem = new LowercaseStringFormatter();
        let dts = testItem.format({}, LookupKey.Lowercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a string or primitive');
    });
});
describe('NumberFormatter', () => {
    test('en: supports LookupKey.Number is true, others false', () => {
        let testItem = new NumberFormatter();
        expect(testItem.supports(LookupKey.Number, 'en')).toBe(true);
        expect(testItem.supports('anythingelse', 'en')).toBe(false);
    });
    test('supports LookupKey.Number is true no matter the culture', () => {
        let testItem = new NumberFormatter();
        expect(testItem.supports(LookupKey.Number, 'fr')).toBe(true);
        expect(testItem.supports('anythingelse', 'fr')).toBe(false);
    });
    test('en culture with various valid numbers', () => {
        let testItem = new NumberFormatter();
        let dts = testItem.format(1, LookupKey.Number, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('1');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format(1.5, LookupKey.Number, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('1.5');
        dts = testItem.format(1000000, LookupKey.Number, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('1,000,000');
        dts = testItem.format(-9.50101, LookupKey.Number, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('-9.501');
    });
    test('fr culture with various valid numbers', () => {
        let testItem = new NumberFormatter();
        let dts = testItem.format(1, LookupKey.Number, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('1');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format(1.5, LookupKey.Number, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('1,5');
        dts = testItem.format(1000000, LookupKey.Number, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('1\u{202F}000\u{202F}000');
        dts = testItem.format(-9.50101, LookupKey.Number, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('-9,501');
    });
    test('en culture with ways to output empty string', () => {
        let testItem = new NumberFormatter();
        let dts = testItem.format(null, LookupKey.Number, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format(undefined, LookupKey.Number, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
    });
    test('Invalid type returns errorMessage', () => {
        let testItem = new NumberFormatter();
        let dts = testItem.format('A', LookupKey.Number, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a number');
        dts = testItem.format({}, LookupKey.Number, 'en');
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a number');
    });
});
describe('CurrencyFormatter', () => {
    test('en: supports LookupKey.Currency is true. All others are false', () => {
        let testItem = new CurrencyFormatter('USD');
        expect(testItem.supports(LookupKey.Currency, 'en')).toBe(true);
        expect(testItem.supports('anythingelse', 'en')).toBe(false);
    });
    test('supports LookupKey.Currency is true in all cultures', () => {
        let testItem = new CurrencyFormatter('USD');
        expect(testItem.supports(LookupKey.Currency, 'fr')).toBe(true);
        expect(testItem.supports('anythingelse', 'fr')).toBe(false);
    });
    test('en culture with various valid numbers, using currencycode USD from global default', () => {
        let testItem = new CurrencyFormatter('USD');
        let dts = testItem.format(1, LookupKey.Currency, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('$1.00');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format(1.5, LookupKey.Currency, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('$1.50');
        dts = testItem.format(1000000, LookupKey.Currency, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('$1,000,000.00');
        dts = testItem.format(-9.50101, LookupKey.Currency, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('-$9.50');
    });
    test('fr culture with various valid numbers', () => {
        let testItem = new CurrencyFormatter('USD', null, {
            'fr': 'EUR',
        });
        let dts = testItem.format(1, LookupKey.Currency, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('1,00\xA0€');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format(1.5, LookupKey.Currency, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('1,50\xA0€');
        dts = testItem.format(1000000, LookupKey.Currency, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('1\u{202F}000\u{202F}000,00\xA0€');
        dts = testItem.format(-9.50101, LookupKey.Currency, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('-9,50\xA0€');
    });
    test('fr-FR culture with various valid numbers', () => {
        let testItem = new CurrencyFormatter('USD', null, {
            'fr-FR': 'EUR',
        });
        let dts = testItem.format(1, LookupKey.Currency, 'fr-FR');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('1,00\xA0€');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format(1.5, LookupKey.Currency, 'fr-FR');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('1,50\xA0€');
        dts = testItem.format(1000000, LookupKey.Currency, 'fr-FR');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('1\u{202F}000\u{202F}000,00\xA0€');
        dts = testItem.format(-9.50101, LookupKey.Currency, 'fr-FR');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('-9,50\xA0€');
    });
    test('When full culture is missing in constructor, fallback to countrycode culture', () => {
        let testItem = new CurrencyFormatter('EUR', null, {
            'fr': 'EUR',
        });
        let dts = testItem.format(1, LookupKey.Currency, 'fr-FR');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('1,00\xA0€');
        expect(dts.errorMessage).toBeUndefined();
    });
    test('With global default currency code of USD and currencycode is missing in constructor, use default currency code', () => {
        let testItem = new CurrencyFormatter('USD', null);
        let dts = testItem.format(1, LookupKey.Currency, 'fr-FR');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('1,00\xA0$US'); // fr formatting, but US currency symbol
        expect(dts.errorMessage).toBeUndefined();
    });
    test('With EUR as default currency code, LookupKey.Currency uses EUR when currencycode is missing in constructor', () => {
        let testItem = new CurrencyFormatter('EUR', null);
        let dts = testItem.format(1, LookupKey.Currency, 'fr-FR');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('1,00\xA0€');
        expect(dts.errorMessage).toBeUndefined();
        // try english and get its formatting, but still uses the fr currency symbol
        dts = testItem.format(1, LookupKey.Currency, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('€1.00');
        expect(dts.errorMessage).toBeUndefined();
    });
    test('null and undefined input results in empty string', () => {
        let testItem = new CurrencyFormatter('USD');
        let dts = testItem.format(null, LookupKey.Currency, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format(undefined, LookupKey.Currency, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
    });
    test('Invalid type returns errorMessage', () => {
        let testItem = new CurrencyFormatter('USD');
        let dts = testItem.format('A', LookupKey.Currency, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a number');
        dts = testItem.format({}, LookupKey.Currency, 'en');
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a number');
    });
});
describe('PercentageFormatter', () => {
    test('en: supports LookupKey.Percentage is true. All others false', () => {
        let testItem = new PercentageFormatter();
        expect(testItem.supports(LookupKey.Percentage, 'en')).toBe(true);
        expect(testItem.supports('anythingelse', 'en')).toBe(false);
    });
    test('all cultures: supports LookupKey.Percentage is true. All others false', () => {
        let testItem = new PercentageFormatter();
        expect(testItem.supports(LookupKey.Percentage, 'fr')).toBe(true);
        expect(testItem.supports('anythingelse', 'fr')).toBe(false);
    });
    test('en culture with various valid numbers', () => {
        let testItem = new PercentageFormatter();
        let dts = testItem.format(1, LookupKey.Percentage, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('100%');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format(0.15, LookupKey.Percentage, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('15%');
        dts = testItem.format(1000, LookupKey.Percentage, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('100,000%');
        dts = testItem.format(-0.09, LookupKey.Percentage, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('-9%');
    });
    test('fr culture with various valid numbers', () => {
        let testItem = new PercentageFormatter();
        let dts = testItem.format(1, LookupKey.Percentage, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('100\xA0%');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format(0.15, LookupKey.Percentage, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('15\xA0%');
        dts = testItem.format(1000, LookupKey.Percentage, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('100\u{202F}000\xA0%');
        dts = testItem.format(-0.09, LookupKey.Percentage, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('-9\xA0%');
    });
    test('null and undefined empty string', () => {
        let testItem = new PercentageFormatter();
        let dts = testItem.format(null, LookupKey.Percentage, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format(undefined, LookupKey.Percentage, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
    });
    test('Invalid type returns errorMessage', () => {
        let testItem = new PercentageFormatter();
        let dts = testItem.format('A', LookupKey.Percentage, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a number');
        dts = testItem.format({}, LookupKey.Percentage, 'en');
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a number');
    });
});
describe('Percentage100Formatter', () => {
    test('en: supports LookupKey.Percentage100 is true. All others false', () => {
        let testItem = new Percentage100Formatter();
        expect(testItem.supports(LookupKey.Percentage100, 'en')).toBe(true);
        expect(testItem.supports('anythingelse', 'en')).toBe(false);
    });
    test('all cultures: supports LookupKey.Percentage100 is true. All others false', () => {
        let testItem = new Percentage100Formatter();
        expect(testItem.supports(LookupKey.Percentage100, 'fr')).toBe(true);
        expect(testItem.supports('anythingelse', 'fr')).toBe(false);
    });
    test('en culture with various valid numbers', () => {
        let testItem = new Percentage100Formatter();
        let dts = testItem.format(100, LookupKey.Percentage100, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('100%');
        expect(dts.errorMessage).toBeUndefined();
        // Intl rounds percentage by default.
        dts = testItem.format(15.2, LookupKey.Percentage100, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('15%');
        dts = testItem.format(15.5, LookupKey.Percentage100, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('16%');
        dts = testItem.format(1000, LookupKey.Percentage100, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('1,000%');
        dts = testItem.format(-9, LookupKey.Percentage100, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('-9%');
    });
    test('fr culture with various valid numbers', () => {
        let testItem = new Percentage100Formatter();
        let dts = testItem.format(100, LookupKey.Percentage100, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('100\xA0%');
        expect(dts.errorMessage).toBeUndefined();
        // Intl rounds percentage by default
        dts = testItem.format(15.2, LookupKey.Percentage100, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('15\xA0%');
        dts = testItem.format(15.5, LookupKey.Percentage100, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('16\xA0%');
        dts = testItem.format(1000, LookupKey.Percentage100, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('1\u{202F}000\xA0%');
        dts = testItem.format(-9, LookupKey.Percentage100, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('-9\xA0%');
    });
    test('null and undefined empty string', () => {
        let testItem = new Percentage100Formatter();
        let dts = testItem.format(null, LookupKey.Percentage100, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format(undefined, LookupKey.Percentage100, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
    });
    test('Invalid type returns errorMessage', () => {
        let testItem = new Percentage100Formatter();
        let dts = testItem.format('A', LookupKey.Percentage100, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a number');
        dts = testItem.format({}, LookupKey.Percentage100, 'en');
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a number');
    });
});
describe('BooleanFormatter', () => {
    test('en culture supports LookupKey.Boolean is true. All others are false', () => {
        let testItem = new BooleanFormatter(LookupKey.Boolean);
        expect(testItem.supports(LookupKey.Boolean, 'en')).toBe(true);
        expect(testItem.supports('anylookupkey', 'en')).toBe(false);
    });
    test('any culture supports LookupKey.Boolean is true. All others are false', () => {
        let testItem = new BooleanFormatter(LookupKey.Boolean);
        expect(testItem.supports(LookupKey.Boolean, 'fr')).toBe(true);
        expect(testItem.supports('anylookupkey', 'fr')).toBe(false);
    });
    test('Without TextLocalizationService, true and false are "true" and "false"', () => {
        let testItem = new BooleanFormatter(LookupKey.Boolean);
        let dts = testItem.format(true, LookupKey.Boolean, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('true');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format(false, LookupKey.Boolean, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('false');
    });
    test('Without TextLocalizationService, true and false are values supplied in the constructor', () => {
        let testItem = new BooleanFormatter(LookupKey.Boolean, "T", "F");
        let dts = testItem.format(true, LookupKey.Boolean, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('T');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format(false, LookupKey.Boolean, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('F');
    });
    test('TextLocalizationService used for labels unless the culture is not setup', () => {
        let services = new MockValidationServices(false, false);
        let tlService = services.textLocalizerService;
        tlService.register('TRUE', {
            'en': 'enTRUE',
            'es': 'esTRUE'
        });
        tlService.register('FALSE', {
            'en': 'enFALSE',
            'es': 'esFALSE'
        });
        let testItem = new BooleanFormatter(LookupKey.Boolean, 'true', 'false', 'TRUE', 'FALSE');
        testItem.services = services;
        let dts = testItem.format(true, LookupKey.Boolean, 'en'); // uses global default
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('enTRUE');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format(false, LookupKey.Boolean, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('enFALSE');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format(true, LookupKey.Boolean, 'en-US');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('enTRUE');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format(false, LookupKey.Boolean, 'en-US');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('enFALSE');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format(true, LookupKey.Boolean, 'en-GB'); // fallback to global default
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('enTRUE');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format(false, LookupKey.Boolean, 'en-GB');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('enFALSE');
        dts = testItem.format(true, LookupKey.Boolean, 'es');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('esTRUE');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format(false, LookupKey.Boolean, 'es');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('esFALSE');
        dts = testItem.format(true, LookupKey.Boolean, 'es-SP');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('esTRUE');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format(false, LookupKey.Boolean, 'es-SP');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('esFALSE');
        dts = testItem.format(true, LookupKey.Boolean, 'fr'); // fallback to defaults
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('true');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format(false, LookupKey.Boolean, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('false');
    });
    test('null or undefined returns empty string', () => {
        let testItem = new BooleanFormatter(LookupKey.Boolean);
        let dts = testItem.format(null, LookupKey.Boolean, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format(undefined, LookupKey.Boolean, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
    });
    test('Invalid type returns errorMessage', () => {
        let testItem = new BooleanFormatter(LookupKey.Boolean);
        let dts = testItem.format('A', LookupKey.Boolean, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a boolean');
        dts = testItem.format(1, LookupKey.Boolean, 'en');
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a boolean');
    });
});
describe('DateTimeFormatter', () => {
    test('en: supports LookupKey.DateTime is true. Others are false', () => {
        let testItem = new DateTimeFormatter();
        expect(testItem.supports(LookupKey.DateTime, 'en')).toBe(true);
        expect(testItem.supports('anythingelse', 'en')).toBe(false);
    });
    test('any culture: supports LookupKey.DateTime is true. Others are false', () => {
        let testItem = new DateTimeFormatter();
        expect(testItem.supports(LookupKey.DateTime, 'fr')).toBe(true);
        expect(testItem.supports('otherlookupkeys', 'fr')).toBe(false);
    });
    test('en culture with various valid dates', () => {
        let testItem = new DateTimeFormatter();
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.format(date1, LookupKey.DateTime, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('10/31/2000, 12:00 AM');
        expect(dts.errorMessage).toBeUndefined();
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dts = testItem.format(date2, LookupKey.DateTime, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('1/1/1980, 4:00 AM');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);
        dts = testItem.format(date3, LookupKey.DateTime, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('1/15/1980, 4:04 PM');
    });
    test('fr culture with various valid dates', () => {
        let testItem = new DateTimeFormatter();
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.format(date1, LookupKey.DateTime, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('31/10/2000 00:00');
        expect(dts.errorMessage).toBeUndefined();
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dts = testItem.format(date2, LookupKey.DateTime, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('01/01/1980 04:00');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);
        dts = testItem.format(date3, LookupKey.DateTime, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('15/01/1980 16:04');
    });
    test('null or undefined return empty string', () => {
        let testItem = new DateTimeFormatter();
        let dts = testItem.format(null, LookupKey.DateTime, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format(undefined, LookupKey.DateTime, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
        expect(dts.errorMessage).toBeUndefined();
    });
    test('Calues other than Date, null or undefined are errors', () => {
        let testItem = new DateTimeFormatter();
        let dts = testItem.format({}, LookupKey.DateTime, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a date');
        dts = testItem.format('', LookupKey.DateTime, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a date');
        dts = testItem.format(10, LookupKey.DateTime, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a date');
        dts = testItem.format(true, LookupKey.DateTime, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a date');
    });
});
describe('DateFormatter', () => {
    test('en: supports LookupKey.Date is true. Others are false', () => {
        let testItem = new DateFormatter();
        expect(testItem.supports(LookupKey.Date, 'en')).toBe(true);
        expect(testItem.supports('otherlookupkey', 'en')).toBe(false);
    });
    test('all cultures: supports LookupKey.Date is true. Others are false', () => {
        let testItem = new DateFormatter();
        expect(testItem.supports(LookupKey.Date, 'fr')).toBe(true);
        expect(testItem.supports('otherlookupkey', 'fr')).toBe(false);
    });
    test('en culture with various valid dates', () => {
        let testItem = new DateFormatter();
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.format(date1, LookupKey.Date, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('10/31/2000');
        expect(dts.errorMessage).toBeUndefined();
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dts = testItem.format(date2, LookupKey.Date, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('1/1/1980');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);
        dts = testItem.format(date3, LookupKey.Date, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('1/15/1980');
    });
    test('fr culture with various valid dates', () => {
        let testItem = new DateFormatter();
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.format(date1, LookupKey.Date, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('31/10/2000');
        expect(dts.errorMessage).toBeUndefined();
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dts = testItem.format(date2, LookupKey.Date, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('01/01/1980');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);
        dts = testItem.format(date3, LookupKey.Date, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('15/01/1980');
    });
    test('null or undefined returns empty string', () => {
        let testItem = new DateFormatter();
        let dts = testItem.format(null, LookupKey.Date, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format(undefined, LookupKey.Date, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
        expect(dts.errorMessage).toBeUndefined();
    });
    test('Values other than Date, null or undefined are errors', () => {
        let testItem = new DateFormatter();
        let dts = testItem.format({}, LookupKey.Date, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a date');
        dts = testItem.format('', LookupKey.Date, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a date');
        dts = testItem.format(10, LookupKey.Date, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a date');
        dts = testItem.format(true, LookupKey.Date, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a date');
    });
});
describe('AbbrevDateFormatter', () => {
    test('en: supports LookupKey.AbbrevDate is true. Others are false', () => {
        let testItem = new AbbrevDateFormatter();
        expect(testItem.supports(LookupKey.AbbrevDate, 'en')).toBe(true);
        expect(testItem.supports('otherlookupkey', 'en')).toBe(false);
    });
    test('fr: supports LookupKey.AbbrevDate is true. Others are false', () => {
        let testItem = new AbbrevDateFormatter();
        expect(testItem.supports(LookupKey.AbbrevDate, 'fr')).toBe(true);
        expect(testItem.supports('otherlookupkey', 'fr')).toBe(false);
    });
    test('en culture with various valid dates', () => {
        let testItem = new AbbrevDateFormatter();
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.format(date1, LookupKey.AbbrevDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('Oct 31, 2000');
        expect(dts.errorMessage).toBeUndefined();
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dts = testItem.format(date2, LookupKey.AbbrevDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('Jan 1, 1980');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);
        dts = testItem.format(date3, LookupKey.AbbrevDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('Jan 15, 1980');
    });
    test('fr culture with various valid dates', () => {
        let testItem = new AbbrevDateFormatter();
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.format(date1, LookupKey.AbbrevDate, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('31 oct. 2000');
        expect(dts.errorMessage).toBeUndefined();
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dts = testItem.format(date2, LookupKey.AbbrevDate, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('1 janv. 1980');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);
        dts = testItem.format(date3, LookupKey.AbbrevDate, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('15 janv. 1980');
    });
    test('null or undefined returns empty string', () => {
        let testItem = new AbbrevDateFormatter();
        let dts = testItem.format(null, LookupKey.AbbrevDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format(undefined, LookupKey.AbbrevDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
        expect(dts.errorMessage).toBeUndefined();
    });
    test('Values other than Date, null or undefined are errors', () => {
        let testItem = new AbbrevDateFormatter();
        let dts = testItem.format({}, LookupKey.AbbrevDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a date');
        dts = testItem.format('', LookupKey.AbbrevDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a date');
        dts = testItem.format(10, LookupKey.AbbrevDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a date');
        dts = testItem.format(true, LookupKey.AbbrevDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a date');
    });
});
describe('AbbrevDOWDateFormatter', () => {
    test('en: supports LookupKey.AbbrevDOWDate is true. Others are false', () => {
        let testItem = new AbbrevDOWDateFormatter();
        expect(testItem.supports(LookupKey.AbbrevDOWDate, 'en')).toBe(true);
        expect(testItem.supports('otherlookupkey', 'en')).toBe(false);
    });
    test('all cultures: supports LookupKey.AbbrevDOWDate is true. Others are false', () => {
        let testItem = new AbbrevDOWDateFormatter();
        expect(testItem.supports(LookupKey.AbbrevDOWDate, 'fr')).toBe(true);
        expect(testItem.supports('otherlookupkey', 'fr')).toBe(false);
    });
    test('en culture with various valid dates', () => {
        let testItem = new AbbrevDOWDateFormatter();
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.format(date1, LookupKey.AbbrevDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('Tue, Oct 31, 2000');
        expect(dts.errorMessage).toBeUndefined();
        let date2 = new Date(1980, 0, 2, 4, 0, 30);
        dts = testItem.format(date2, LookupKey.AbbrevDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('Wed, Jan 2, 1980');
        let date3 = new Date(1980, 0, 18, 16, 4, 0);
        dts = testItem.format(date3, LookupKey.AbbrevDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('Fri, Jan 18, 1980');
    });
    test('fr culture with various valid dates', () => {
        let testItem = new AbbrevDOWDateFormatter();
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.format(date1, LookupKey.AbbrevDOWDate, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('mar. 31 oct. 2000');
        expect(dts.errorMessage).toBeUndefined();
        let date2 = new Date(1980, 0, 3, 4, 0, 30);
        dts = testItem.format(date2, LookupKey.AbbrevDOWDate, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('jeu. 3 janv. 1980');
        let date3 = new Date(1980, 0, 18, 16, 4, 0);
        dts = testItem.format(date3, LookupKey.AbbrevDOWDate, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('ven. 18 janv. 1980');
    });
    test('Null or undefined returns empty string', () => {
        let testItem = new AbbrevDOWDateFormatter();
        let dts = testItem.format(null, LookupKey.AbbrevDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format(undefined, LookupKey.AbbrevDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
        expect(dts.errorMessage).toBeUndefined();
    });
    test('Values other than Date, null or undefined are errors', () => {
        let testItem = new AbbrevDOWDateFormatter();
        let dts = testItem.format({}, LookupKey.AbbrevDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a date');
        dts = testItem.format('', LookupKey.AbbrevDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a date');
        dts = testItem.format(10, LookupKey.AbbrevDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a date');
        dts = testItem.format(true, LookupKey.AbbrevDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a date');
    });
});
describe('LongDateFormatter', () => {
    test('en: supports LookupKey.LongDate is true. Others are false', () => {
        let testItem = new LongDateFormatter();
        expect(testItem.supports(LookupKey.LongDate, 'en')).toBe(true);
        expect(testItem.supports('otherlookupkey', 'en')).toBe(false);
    });
    test('fr: supports LookupKey.LongDate is true. Others are false', () => {
        let testItem = new LongDateFormatter();
        expect(testItem.supports(LookupKey.LongDate, 'fr')).toBe(true);
        expect(testItem.supports('otherlookupkey', 'fr')).toBe(false);
    });
    test('en culture with various valid dates', () => {
        let testItem = new LongDateFormatter();
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.format(date1, LookupKey.LongDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('October 31, 2000');
        expect(dts.errorMessage).toBeUndefined();
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dts = testItem.format(date2, LookupKey.LongDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('January 1, 1980');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);
        dts = testItem.format(date3, LookupKey.LongDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('January 15, 1980');
    });
    test('fr culture with various valid dates', () => {
        let testItem = new LongDateFormatter();
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.format(date1, LookupKey.LongDate, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('31 octobre 2000');
        expect(dts.errorMessage).toBeUndefined();
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dts = testItem.format(date2, LookupKey.LongDate, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('1 janvier 1980');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);
        dts = testItem.format(date3, LookupKey.LongDate, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('15 janvier 1980');
    });
    test('null or undefined returns empty string', () => {
        let testItem = new LongDateFormatter();
        let dts = testItem.format(null, LookupKey.LongDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format(undefined, LookupKey.LongDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
        expect(dts.errorMessage).toBeUndefined();
    });
    test('Values other than Date, null or undefined are errors', () => {
        let testItem = new LongDateFormatter();
        let dts = testItem.format({}, LookupKey.LongDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a date');
        dts = testItem.format('', LookupKey.LongDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a date');
        dts = testItem.format(10, LookupKey.LongDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a date');
        dts = testItem.format(true, LookupKey.LongDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a date');
    });
});
describe('LongDOWDateFormatter', () => {
    test('en: supports LookupKey.LongDOWDate is true. Others are false', () => {
        let testItem = new LongDOWDateFormatter();
        expect(testItem.supports(LookupKey.LongDOWDate, 'en')).toBe(true);
        expect(testItem.supports('otherlookupkey', 'en')).toBe(false);
    });
    test('fr: supports LookupKey.LongDOWDate is true. Others are false', () => {
        let testItem = new LongDOWDateFormatter();
        expect(testItem.supports(LookupKey.LongDOWDate, 'fr')).toBe(true);
        expect(testItem.supports('otherlookupkey', 'fr')).toBe(false);
    });
    test('en culture with various valid dates', () => {
        let testItem = new LongDOWDateFormatter();
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.format(date1, LookupKey.LongDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('Tuesday, October 31, 2000');
        expect(dts.errorMessage).toBeUndefined();
        let date2 = new Date(1980, 0, 2, 4, 0, 30);
        dts = testItem.format(date2, LookupKey.LongDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('Wednesday, January 2, 1980');
        let date3 = new Date(1980, 0, 18, 16, 4, 0);
        dts = testItem.format(date3, LookupKey.LongDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('Friday, January 18, 1980');
    });
    test('fr culture with various valid dates', () => {
        let testItem = new LongDOWDateFormatter();
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.format(date1, LookupKey.LongDOWDate, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('mardi 31 octobre 2000');
        expect(dts.errorMessage).toBeUndefined();
        let date2 = new Date(1980, 0, 3, 4, 0, 30);
        dts = testItem.format(date2, LookupKey.LongDOWDate, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('jeudi 3 janvier 1980');
        let date3 = new Date(1980, 0, 18, 16, 4, 0);
        dts = testItem.format(date3, LookupKey.LongDOWDate, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('vendredi 18 janvier 1980');
    });
    test('null or undefined returns empty string', () => {
        let testItem = new LongDOWDateFormatter();
        let dts = testItem.format(null, LookupKey.LongDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format(undefined, LookupKey.LongDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
        expect(dts.errorMessage).toBeUndefined();
    });
    test('Values other than Date, null or undefined are errors', () => {
        let testItem = new LongDOWDateFormatter();
        let dts = testItem.format({}, LookupKey.LongDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a date');
        dts = testItem.format('', LookupKey.LongDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a date');
        dts = testItem.format(10, LookupKey.LongDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a date');
        dts = testItem.format(true, LookupKey.LongDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a date');
    });
});
describe('TimeofDayFormatter', () => {
    test('en: supports LookupKey.TimeOfDay is true. Others are false', () => {
        let testItem = new TimeofDayFormatter();
        expect(testItem.supports(LookupKey.TimeOfDay, 'en')).toBe(true);
        expect(testItem.supports('otherlookupkey', 'en')).toBe(false);
    });
    test('other cultures: supports LookupKey.TimeOfDay is true. Others are false', () => {
        let testItem = new TimeofDayFormatter();
        expect(testItem.supports(LookupKey.TimeOfDay, 'otherculture')).toBe(true);
        expect(testItem.supports('otherlookupkey', 'otherculture')).toBe(false);
    });
    test('en culture with various valid dates', () => {
        let testItem = new TimeofDayFormatter();
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.format(date1, LookupKey.TimeOfDay, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('12:00 AM');
        expect(dts.errorMessage).toBeUndefined();
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dts = testItem.format(date2, LookupKey.TimeOfDay, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('4:00 AM');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);
        dts = testItem.format(date3, LookupKey.TimeOfDay, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('4:04 PM');
    });
    test('fr culture with various valid dates', () => {
        let testItem = new TimeofDayFormatter();
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.format(date1, LookupKey.TimeOfDay, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('00:00');
        expect(dts.errorMessage).toBeUndefined();
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dts = testItem.format(date2, LookupKey.TimeOfDay, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('04:00');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);
        dts = testItem.format(date3, LookupKey.TimeOfDay, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('16:04');
    });
    test('null or undefined returns empty string', () => {
        let testItem = new TimeofDayFormatter();
        let dts = testItem.format(null, LookupKey.TimeOfDay, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format(undefined, LookupKey.TimeOfDay, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
        expect(dts.errorMessage).toBeUndefined();
    });
    test('values other than Date, null or undefined are errors', () => {
        let testItem = new TimeofDayFormatter();
        let dts = testItem.format({}, LookupKey.TimeOfDay, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a date');
        dts = testItem.format('', LookupKey.TimeOfDay, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a date');
        dts = testItem.format(10, LookupKey.TimeOfDay, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a date');
        dts = testItem.format(true, LookupKey.TimeOfDay, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a date');
    });
});
describe('TimeofDayHMSFormatter', () => {
    test('en: supports LookupKey.TimeOfDayHMS is true. Others are false', () => {
        let testItem = new TimeofDayHMSFormatter();
        expect(testItem.supports(LookupKey.TimeOfDayHMS, 'en')).toBe(true);
        expect(testItem.supports('otherlookupkey', 'en')).toBe(false);
    });
    test('other culture: supports LookupKey.TimeOfDayHMS is true. Others are false', () => {
        let testItem = new TimeofDayHMSFormatter();
        expect(testItem.supports(LookupKey.TimeOfDayHMS, 'otherculture')).toBe(true);
        expect(testItem.supports('otherlookupkey', 'otherculture')).toBe(false);
    });
    test('fr culture with various valid dates', () => {
        let testItem = new TimeofDayHMSFormatter();
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.format(date1, LookupKey.TimeOfDayHMS, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('00:00:00');
        expect(dts.errorMessage).toBeUndefined();
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dts = testItem.format(date2, LookupKey.TimeOfDayHMS, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('04:00:30');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);
        dts = testItem.format(date3, LookupKey.TimeOfDayHMS, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('16:04:00');
    });
    test('null or undefined returns empty string', () => {
        let testItem = new TimeofDayHMSFormatter();
        let dts = testItem.format(null, LookupKey.TimeOfDayHMS, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
        expect(dts.errorMessage).toBeUndefined();
        dts = testItem.format(undefined, LookupKey.TimeOfDayHMS, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe('');
        expect(dts.errorMessage).toBeUndefined();
    });
    test('Values other than Date, null or undefined are errors', () => {
        let testItem = new TimeofDayHMSFormatter();
        let dts = testItem.format({}, LookupKey.TimeOfDayHMS, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a date');
        dts = testItem.format('', LookupKey.TimeOfDayHMS, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a date');
        dts = testItem.format(10, LookupKey.TimeOfDayHMS, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a date');
        dts = testItem.format(true, LookupKey.TimeOfDayHMS, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).toBe('Not a date');
    });
});
//# sourceMappingURL=DataTypeFormatters.test.js.map