import { IntlLocalizationAdapter } from "../../src/DataTypes/DataTypeLocalizedFormatters";
import {
    StringLookupKey, CapitalizeStringLookupKey, UppercaseStringLookupKey, LowercaseStringLookupKey,
    NumberLookupKey, CurrencyLookupKey, PercentageLookupKey, BooleanLookupKey, YesNoBooleanLookupKey, DateTimeLookupKey, DateLookupKey,
    AbbrevDateLookupKey, AbbrevDOWDateLookupKey, LongDateLookupKey, LongDOWDateLookupKey, TimeOfDayLookupKey, TimeOfDayHMSLookupKey
} from "../../src/DataTypes/LookupKeys";
describe('LocalizationAdapter.IntlLocalizationAdapter CultureID and fallbackCultureIDs functions', () => {
    test('EN CultureID, no fallback', () => {
        let la = new IntlLocalizationAdapter('en');
        expect(la.CultureID).toBe('en');
        expect(la.FallbackCultureID).toBeNull();
        expect(la.Currency).toBe('USD');
    });
    test('en-GB CultureID, en fallback', () => {
        let la = new IntlLocalizationAdapter('en-GB', 'en');
        expect(la.CultureID).toBe('en-GB');
        expect(la.FallbackCultureID).toBe('en');
        expect(la.Currency).toBe('USD');
    });    
    test('Currency set', () => {
        let la = new IntlLocalizationAdapter('en-GB', 'en', 'GBP');
        expect(la.Currency).toBe('GBP');
    });        
});

describe('LocalizationAdapter.IntlLocalizationAdapter class preregistered Format functions', () => {
    test('CanFormat Unknown LookupKey is false', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        expect(la.CanFormat("*Unknown*")).toBe(false);        
    });

    test('CanFormat StringLookupKey is true', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        expect(la.CanFormat(StringLookupKey)).toBe(true);        
    });
    test('StringLookupKey with string', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format('A', StringLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('A');
        expect(dtr.ErrorMessage).toBeUndefined();
    });
    test('StringLookupKey with number is converted to string', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format(15, StringLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('15');
        expect(dtr.ErrorMessage).toBeUndefined();
        
    });    
    test('StringLookupKey with null is empty string', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format(null, StringLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
    });    
    test('StringLookupKey with undefined is empty string', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format(undefined, StringLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
    });
    test('StringLookupKey with object is an error', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format({}, StringLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a string or primitive');
        
    });    
    test('CanFormat CapitalizeStringLookupKey is true', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        expect(la.CanFormat(CapitalizeStringLookupKey)).toBe(true);        
    });

    test('CapitalizeStringLookupKey with string returns the string with first letter capitalized', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format('A', CapitalizeStringLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('A');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = la.Format('a', CapitalizeStringLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('A');
        dtr = la.Format('abc', CapitalizeStringLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('Abc');        
        dtr = la.Format('', CapitalizeStringLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');        
    });        
    test('CanFormat UppercaseStringLookupKey is true', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        expect(la.CanFormat(UppercaseStringLookupKey)).toBe(true);        
    });

    test('UppercaseStringLookupKey with string returns the string in uppercase', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();

        let dtr = la.Format('A', UppercaseStringLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('A');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = la.Format('a', UppercaseStringLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('A');
        dtr = la.Format('abc', UppercaseStringLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('ABC');        
        dtr = la.Format('', UppercaseStringLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');        
    });            
    test('CanFormat LowercaseStringLookupKey is true', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        expect(la.CanFormat(LowercaseStringLookupKey)).toBe(true);        
    });

    test('LowercaseStringLookupKey with string returns the string in lowercase', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();

        let dtr = la.Format('A', LowercaseStringLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('a');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = la.Format('a', LowercaseStringLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('a');
        dtr = la.Format('abc', LowercaseStringLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('abc');        
        dtr = la.Format('ABC', LowercaseStringLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('abc');
        dtr = la.Format('', LowercaseStringLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');        
    });            
    test('en: CanFormat NumberLookupKey is true', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        expect(la.CanFormat(NumberLookupKey)).toBe(true);        
    });
    test('fr: CanFormat NumberLookupKey is true', () => {
        let la = new IntlLocalizationAdapter('fr');
        la.RegisterBuiltInLookupKeyFunctions();
        expect(la.CanFormat(NumberLookupKey)).toBe(true);        
    });
    test('NumberLookupKey in en culture with various valid numbers', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();

        let dtr = la.Format(1, NumberLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = la.Format(1.5, NumberLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1.5');
        dtr = la.Format(1000000, NumberLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1,000,000');
        dtr = la.Format(-9.50101, NumberLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('-9.501');
    });

    test('NumberLookupKey in fr culture with various valid numbers', () => {
        let la = new IntlLocalizationAdapter('fr');
        la.RegisterBuiltInLookupKeyFunctions();

        let dtr = la.Format(1, NumberLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = la.Format(1.5, NumberLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1,5');
        dtr = la.Format(1000000, NumberLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1\u{202F}000\u{202F}000');
        dtr = la.Format(-9.50101, NumberLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('-9,501');
    });    
    test('NumberLookupKey in en culture with ways to output empty string', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();

        let dtr = la.Format(null, NumberLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = la.Format(undefined, NumberLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
    });
    test('NumberLookupKey with invalid type returns ErrorMessage', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();

        let dtr = la.Format('A', NumberLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a number');
        
        dtr = la.Format({}, NumberLookupKey);
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a number');
        
    });
    test('en: CanFormat CurrencyLookupKey is true', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        expect(la.CanFormat(CurrencyLookupKey)).toBe(true);        
    });
    test('fr: CanFormat CurrencyLookupKey is true', () => {
        let la = new IntlLocalizationAdapter('fr');
        la.RegisterBuiltInLookupKeyFunctions();
        expect(la.CanFormat(CurrencyLookupKey)).toBe(true);        
    });

    test('CurrencyLookupKey in en culture with various valid numbers', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format(1, CurrencyLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('$1.00');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = la.Format(1.5, CurrencyLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('$1.50');
        dtr = la.Format(1000000, CurrencyLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('$1,000,000.00');
        dtr = la.Format(-9.50101, CurrencyLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('-$9.50');
    });

    test('CurrencyLookupKey in fr culture with various valid numbers', () => {
        let la = new IntlLocalizationAdapter('fr', null, 'EUR');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format(1, CurrencyLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1,00\xA0€');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = la.Format(1.5, CurrencyLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1,50\xA0€');
        dtr = la.Format(1000000, CurrencyLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1\u{202F}000\u{202F}000,00\xA0€');
        dtr = la.Format(-9.50101, CurrencyLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('-9,50\xA0€');
    });    
    test('CurrencyLookupKey in en culture with ways to output empty string', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format(null, CurrencyLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = la.Format(undefined, CurrencyLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
    });    
    test('CurrencyLookupKey with invalid type returns ErrorMessage', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format('A', CurrencyLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a number');
        
        dtr = la.Format({}, CurrencyLookupKey);
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a number');
        
    });    
    test('en: CanFormat PercentageLookupKey is true', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        expect(la.CanFormat(PercentageLookupKey)).toBe(true);        
    });
    test('fr: CanFormat PercentageLookupKey is true', () => {
        let la = new IntlLocalizationAdapter('fr');
        la.RegisterBuiltInLookupKeyFunctions();
        expect(la.CanFormat(PercentageLookupKey)).toBe(true);        
    });

    test('PercentageLookupKey in en culture with various valid numbers', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format(1, PercentageLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('100%');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = la.Format(0.15, PercentageLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('15%');
        dtr = la.Format(1000, PercentageLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('100,000%');
        dtr = la.Format(-0.09, PercentageLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('-9%');
    });

    test('PercentageLookupKey in fr culture with various valid numbers', () => {
        let la = new IntlLocalizationAdapter('fr');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format(1, PercentageLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('100\xA0%');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = la.Format(0.15, PercentageLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('15\xA0%');
        dtr = la.Format(1000, PercentageLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('100\u{202F}000\xA0%');
        dtr = la.Format(-0.09, PercentageLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('-9\xA0%');
    });    
    test('PercentageLookupKey in en culture with ways to output empty string', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format(null, PercentageLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = la.Format(undefined, PercentageLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
    });
    test('PercentageLookupKey with invalid type returns ErrorMessage', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format('A', PercentageLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a number');
        
        dtr = la.Format({}, PercentageLookupKey);
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a number');
        
    });
    test('CanFormat BooleanLookupKey is true', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        expect(la.CanFormat(BooleanLookupKey)).toBe(true);        
    });

    test('BooleanLookupKey with true or false is "true" or "false"', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format(true, BooleanLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('true');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = la.Format(false, BooleanLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('false');
    });
    test('BooleanLookupKey with null or undefined is empty string', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format(null, BooleanLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = la.Format(undefined, BooleanLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
    });    
    test('BooleanLookupKey with invalid type returns ErrorMessage', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format('A', BooleanLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a boolean');
        
        dtr = la.Format(1, BooleanLookupKey);
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a boolean');
        
    });
    test('CanFormat YesNoBooleanLookupKey is true', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        expect(la.CanFormat(YesNoBooleanLookupKey)).toBe(true);        
    });

    test('YesNoBooleanLookupKey with true or false is "yes" or "no"', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format(true, YesNoBooleanLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('yes');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = la.Format(false, YesNoBooleanLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('no');
    });
    test('YesNoBooleanLookupKey with null or undefined is empty string', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format(null, YesNoBooleanLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = la.Format(undefined, YesNoBooleanLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
    });    
    test('YesNoBooleanLookupKey with invalid type returns ErrorMessage', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format('A', YesNoBooleanLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a boolean');
        
        dtr = la.Format(1, YesNoBooleanLookupKey);
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a boolean');
        
    });    
    test('en: CanFormat DateTimeLookupKey is true', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        expect(la.CanFormat(DateTimeLookupKey)).toBe(true);        
    });
    test('fr: CanFormat DateTimeLookupKey is true', () => {
        let la = new IntlLocalizationAdapter('fr');
        la.RegisterBuiltInLookupKeyFunctions();
        expect(la.CanFormat(DateTimeLookupKey)).toBe(true);        
    });

    test('DateTimeLookupKey in en culture with various valid dates', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let date1 = new Date(2000, 9, 31);
        let dtr = la.Format(date1, DateTimeLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('10/31/2000, 12:00 AM');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dtr = la.Format(date2, DateTimeLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1/1/1980, 4:00 AM');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dtr = la.Format(date3, DateTimeLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1/15/1980, 4:04 PM');
    });

    test('DateTimeLookupKey in fr culture with various valid dates', () => {
        let la = new IntlLocalizationAdapter('fr');
        la.RegisterBuiltInLookupKeyFunctions();
        let date1 = new Date(2000, 9, 31);
        let dtr = la.Format(date1, DateTimeLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('31/10/2000 00:00');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dtr = la.Format(date2, DateTimeLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('01/01/1980 04:00');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dtr = la.Format(date3, DateTimeLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('15/01/1980 16:04');
    });    
    test('DateTimeLookupKey with null or undefined is empty string', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format(null, DateTimeLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = la.Format(undefined, DateTimeLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
    });
    test('DateTimeLookupKey with values other than Date, null or undefined are errors', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format({}, DateTimeLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
        
        dtr = la.Format('', DateTimeLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
        
        dtr = la.Format(10, DateTimeLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
            
        dtr = la.Format(true, DateTimeLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
                
    });
    test('en: CanFormat DateLookupKey is true', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        expect(la.CanFormat(DateLookupKey)).toBe(true);        
    });
    test('fr: CanFormat DateLookupKey is true', () => {
        let la = new IntlLocalizationAdapter('fr');
        la.RegisterBuiltInLookupKeyFunctions();
        expect(la.CanFormat(DateLookupKey)).toBe(true);        
    });

    test('DateLookupKey in en culture with various valid dates', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let date1 = new Date(2000, 9, 31);
        let dtr = la.Format(date1, DateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('10/31/2000');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dtr = la.Format(date2, DateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1/1/1980');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dtr = la.Format(date3, DateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1/15/1980');
    });

    test('DateLookupKey in fr culture with various valid dates', () => {
        let la = new IntlLocalizationAdapter('fr');
        la.RegisterBuiltInLookupKeyFunctions();
        let date1 = new Date(2000, 9, 31);
        let dtr = la.Format(date1, DateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('31/10/2000');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dtr = la.Format(date2, DateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('01/01/1980');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dtr = la.Format(date3, DateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('15/01/1980');
    });    
    test('DateLookupKey with null or undefined is empty string', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format(null, DateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = la.Format(undefined, DateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
    });
    test('DateLookupKey with values other than Date, null or undefined are errors', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format({}, DateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
        
        dtr = la.Format('', DateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
        
        dtr = la.Format(10, DateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
            
        dtr = la.Format(true, DateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
                
    });

    test('en: CanFormat AbbrevDateLookupKey is true', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        expect(la.CanFormat(AbbrevDateLookupKey)).toBe(true);        
    });
    test('fr: CanFormat AbbrevDateLookupKey is true', () => {
        let la = new IntlLocalizationAdapter('fr');
        la.RegisterBuiltInLookupKeyFunctions();
        expect(la.CanFormat(AbbrevDateLookupKey)).toBe(true);        
    });
    test('AbbrevDateLookupKey in en culture with various valid dates', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let date1 = new Date(2000, 9, 31);
        let dtr = la.Format(date1, AbbrevDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('Oct 31, 2000');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dtr = la.Format(date2, AbbrevDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('Jan 1, 1980');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dtr = la.Format(date3, AbbrevDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('Jan 15, 1980');
    });

    test('AbbrevDateLookupKey in fr culture with various valid dates', () => {
        let la = new IntlLocalizationAdapter('fr');
        la.RegisterBuiltInLookupKeyFunctions();
        let date1 = new Date(2000, 9, 31);
        let dtr = la.Format(date1, AbbrevDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('31 oct. 2000');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dtr = la.Format(date2, AbbrevDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1 janv. 1980');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dtr = la.Format(date3, AbbrevDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('15 janv. 1980');
    });    
    test('AbbrevDateLookupKey with null or undefined is empty string', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format(null, AbbrevDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = la.Format(undefined, AbbrevDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
    });
    test('AbbrevDateLookupKey with values other than Date, null or undefined are errors', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format({}, AbbrevDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
        
        dtr = la.Format('', AbbrevDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
        
        dtr = la.Format(10, AbbrevDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
            
        dtr = la.Format(true, AbbrevDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
                
    });
    test('en: CanFormat AbbrevDOWDateLookupKey is true', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        expect(la.CanFormat(AbbrevDOWDateLookupKey)).toBe(true);        
    });
    test('fr: CanFormat AbbrevDOWDateLookupKey is true', () => {
        let la = new IntlLocalizationAdapter('fr');
        la.RegisterBuiltInLookupKeyFunctions();
        expect(la.CanFormat(AbbrevDOWDateLookupKey)).toBe(true);        
    });

    test('AbbrevDOWDateLookupKey in en culture with various valid dates', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let date1 = new Date(2000, 9, 31);
        let dtr = la.Format(date1, AbbrevDOWDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('Tue, Oct 31, 2000');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 2, 4, 0, 30);
        dtr = la.Format(date2, AbbrevDOWDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('Wed, Jan 2, 1980');
        let date3 = new Date(1980, 0, 18, 16, 4, 0);        
        dtr = la.Format(date3, AbbrevDOWDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('Fri, Jan 18, 1980');
    });

    test('AbbrevDOWDateLookupKey in fr culture with various valid dates', () => {
        let la = new IntlLocalizationAdapter('fr');
        la.RegisterBuiltInLookupKeyFunctions();
        let date1 = new Date(2000, 9, 31);
        let dtr = la.Format(date1, AbbrevDOWDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('mar. 31 oct. 2000');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 3, 4, 0, 30);
        dtr = la.Format(date2, AbbrevDOWDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('jeu. 3 janv. 1980');
        let date3 = new Date(1980, 0, 18, 16, 4, 0);        
        dtr = la.Format(date3, AbbrevDOWDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('ven. 18 janv. 1980');
    });    
    test('AbbrevDOWDateLookupKey with null or undefined is empty string', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format(null, AbbrevDOWDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = la.Format(undefined, AbbrevDOWDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
    });
    test('AbbrevDOWDateLookupKey with values other than Date, null or undefined are errors', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format({}, AbbrevDOWDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
        
        dtr = la.Format('', AbbrevDOWDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
        
        dtr = la.Format(10, AbbrevDOWDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
            
        dtr = la.Format(true, AbbrevDOWDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
                
    });    
    test('en: CanFormat LongDateLookupKey is true', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        expect(la.CanFormat(LongDateLookupKey)).toBe(true);        
    });
    test('fr: CanFormat LongDateLookupKey is true', () => {
        let la = new IntlLocalizationAdapter('fr');
        la.RegisterBuiltInLookupKeyFunctions();
        expect(la.CanFormat(LongDateLookupKey)).toBe(true);        
    });
    test('LongDateLookupKey in en culture with various valid dates', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let date1 = new Date(2000, 9, 31);
        let dtr = la.Format(date1, LongDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('October 31, 2000');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dtr = la.Format(date2, LongDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('January 1, 1980');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dtr = la.Format(date3, LongDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('January 15, 1980');
    });

    test('LongDateLookupKey in fr culture with various valid dates', () => {
        let la = new IntlLocalizationAdapter('fr');
        la.RegisterBuiltInLookupKeyFunctions();
        let date1 = new Date(2000, 9, 31);
        let dtr = la.Format(date1, LongDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('31 octobre 2000');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dtr = la.Format(date2, LongDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1 janvier 1980');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dtr = la.Format(date3, LongDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('15 janvier 1980');
    });    
    test('LongDateLookupKey with null or undefined is empty string', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format(null, LongDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = la.Format(undefined, LongDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
    });
    test('LongDateLookupKey with values other than Date, null or undefined are errors', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format({}, LongDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
        
        dtr = la.Format('', LongDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
        
        dtr = la.Format(10, LongDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
            
        dtr = la.Format(true, LongDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
                
    });
    test('en: CanFormat LongDOWDateLookupKey is true', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        expect(la.CanFormat(LongDOWDateLookupKey)).toBe(true);        
    });
    test('fr: CanFormat LongDOWDateLookupKey is true', () => {
        let la = new IntlLocalizationAdapter('fr');
        la.RegisterBuiltInLookupKeyFunctions();
        expect(la.CanFormat(LongDOWDateLookupKey)).toBe(true);        
    });

    test('LongDOWDateLookupKey in en culture with various valid dates', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let date1 = new Date(2000, 9, 31);
        let dtr = la.Format(date1, LongDOWDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('Tuesday, October 31, 2000');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 2, 4, 0, 30);
        dtr = la.Format(date2, LongDOWDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('Wednesday, January 2, 1980');
        let date3 = new Date(1980, 0, 18, 16, 4, 0);        
        dtr = la.Format(date3, LongDOWDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('Friday, January 18, 1980');
    });

    test('LongDOWDateLookupKey in fr culture with various valid dates', () => {
        let la = new IntlLocalizationAdapter('fr');
        la.RegisterBuiltInLookupKeyFunctions();
        let date1 = new Date(2000, 9, 31);
        let dtr = la.Format(date1, LongDOWDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('mardi 31 octobre 2000');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 3, 4, 0, 30);
        dtr = la.Format(date2, LongDOWDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('jeudi 3 janvier 1980');
        let date3 = new Date(1980, 0, 18, 16, 4, 0);        
        dtr = la.Format(date3, LongDOWDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('vendredi 18 janvier 1980');
    });    
    test('LongDOWDateLookupKey with null or undefined is empty string', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format(null, LongDOWDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = la.Format(undefined, LongDOWDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
    });
    test('LongDOWDateLookupKey with values other than Date, null or undefined are errors', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format({}, LongDOWDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
        
        dtr = la.Format('', LongDOWDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
        
        dtr = la.Format(10, LongDOWDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
            
        dtr = la.Format(true, LongDOWDateLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
                
    });        
    test('en: CanFormat TimeOfDayLookupKey is true', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        expect(la.CanFormat(TimeOfDayLookupKey)).toBe(true);        
    });
    test('fr: CanFormat TimeOfDayLookupKey is true', () => {
        let la = new IntlLocalizationAdapter('fr');
        la.RegisterBuiltInLookupKeyFunctions();
        expect(la.CanFormat(TimeOfDayLookupKey)).toBe(true);        
    });
    test('TimeOfDayLookupKey in en culture with various valid dates', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let date1 = new Date(2000, 9, 31);
        let dtr = la.Format(date1, TimeOfDayLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('12:00 AM');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dtr = la.Format(date2, TimeOfDayLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('4:00 AM');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dtr = la.Format(date3, TimeOfDayLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('4:04 PM');
    });

    test('TimeOfDayLookupKey in fr culture with various valid dates', () => {
        let la = new IntlLocalizationAdapter('fr');
        la.RegisterBuiltInLookupKeyFunctions();
        let date1 = new Date(2000, 9, 31);
        let dtr = la.Format(date1, TimeOfDayLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('00:00');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dtr = la.Format(date2, TimeOfDayLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('04:00');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dtr = la.Format(date3, TimeOfDayLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('16:04');
    });    
    test('TimeOfDayLookupKey with null or undefined is empty string', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format(null, TimeOfDayLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = la.Format(undefined, TimeOfDayLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
    });
    test('TimeOfDayLookupKey with values other than Date, null or undefined are errors', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format({}, TimeOfDayLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
        
        dtr = la.Format('', TimeOfDayLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
        
        dtr = la.Format(10, TimeOfDayLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
            
        dtr = la.Format(true, TimeOfDayLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
                
    });    
    test('TimeOfDayLookupKey in en culture with various valid dates', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let date1 = new Date(2000, 9, 31);
        let dtr = la.Format(date1, TimeOfDayHMSLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('12:00:00 AM');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dtr = la.Format(date2, TimeOfDayHMSLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('4:00:30 AM');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dtr = la.Format(date3, TimeOfDayHMSLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('4:04:00 PM');
    });
    test('en: CanFormat TimeOfDayHMSLookupKey is true', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        expect(la.CanFormat(TimeOfDayHMSLookupKey)).toBe(true);        
    });
    test('fr: CanFormat TimeOfDayHMSLookupKey is true', () => {
        let la = new IntlLocalizationAdapter('fr');
        la.RegisterBuiltInLookupKeyFunctions();
        expect(la.CanFormat(TimeOfDayHMSLookupKey)).toBe(true);        
    });

    test('TimeOfDayHMSLookupKey in fr culture with various valid dates', () => {
        let la = new IntlLocalizationAdapter('fr');
        la.RegisterBuiltInLookupKeyFunctions();
        let date1 = new Date(2000, 9, 31);
        let dtr = la.Format(date1, TimeOfDayHMSLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('00:00:00');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dtr = la.Format(date2, TimeOfDayHMSLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('04:00:30');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dtr = la.Format(date3, TimeOfDayHMSLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('16:04:00');
    });    
    test('TimeOfDayHMSLookupKey with null or undefined is empty string', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format(null, TimeOfDayHMSLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = la.Format(undefined, TimeOfDayHMSLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
    });
    test('TimeOfDayHMSLookupKey with values other than Date, null or undefined are errors', () => {
        let la = new IntlLocalizationAdapter('en');
        la.RegisterBuiltInLookupKeyFunctions();
        let dtr = la.Format({}, TimeOfDayHMSLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
        
        dtr = la.Format('', TimeOfDayHMSLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
        
        dtr = la.Format(10, TimeOfDayHMSLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
            
        dtr = la.Format(true, TimeOfDayHMSLookupKey);
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
                
    });        
});