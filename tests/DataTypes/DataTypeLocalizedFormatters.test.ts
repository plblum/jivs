import { AbbrevDOWDateLocalizedFormatter, AbbrevDateLocalizedFormatter, BooleanLocalizedFormatter, CapitalizeStringLocalizedFormatter, CurrencyLocalizedFormatter, DateLocalizedFormatter, DateTimeLocalizedFormatter, LongDOWDateLocalizedFormatter, LongDateLocalizedFormatter, LowercaseStringLocalizedFormatter, NumberLocalizedFormatter, Percentage100LocalizedFormatter, PercentageLocalizedFormatter, StringLocalizedFormatter, TimeofDayHMSLocalizedFormatter, TimeofDayLocalizedFormatter, UppercaseStringLocalizedFormatter, YesNoBooleanLocalizedFormatter } from './../../src/DataTypes/DataTypeLocalizedFormatters';
import {
    StringLookupKey, CapitalizeStringLookupKey, UppercaseStringLookupKey, LowercaseStringLookupKey,
    NumberLookupKey, CurrencyLookupKey, PercentageLookupKey, BooleanLookupKey, YesNoBooleanLookupKey, DateTimeLookupKey, DateLookupKey,
    AbbrevDateLookupKey, AbbrevDOWDateLookupKey, LongDateLookupKey, LongDOWDateLookupKey, TimeOfDayLookupKey, TimeOfDayHMSLookupKey, Percentage100LookupKey
} from "../../src/DataTypes/LookupKeys";

describe('StringLocalizedFormatter', () => {

    test('Supports', () => {
        let testItem = new StringLocalizedFormatter();
        expect(testItem.Supports(StringLookupKey, 'en')).toBe(true);
        expect(testItem.Supports(StringLookupKey, 'fr')).toBe(true);    
        expect(testItem.Supports(NumberLookupKey, 'en')).toBe(false);   
        expect(testItem.Supports(UppercaseStringLookupKey, 'en')).toBe(false);        
    });
    test('en: Format with string parameter', () => {
        let testItem = new StringLocalizedFormatter();
        let dts = testItem.Format('A', StringLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('A');
        expect(dts.ErrorMessage).toBeUndefined();
    });

    test('fr: Format with string parameter', () => {
        let testItem = new StringLocalizedFormatter();
        let dts = testItem.Format('A', StringLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('A');
        expect(dts.ErrorMessage).toBeUndefined();
    });    
    test('Format with number parameter is converted to string', () => {
        let testItem = new StringLocalizedFormatter();
        
        let dts = testItem.Format(15, StringLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('15');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Format with null parameter returns empty string', () => {
        let testItem = new StringLocalizedFormatter();
        
        let dts = testItem.Format(null, StringLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Format with undefined parameter returns empty string', () => {
        let testItem = new StringLocalizedFormatter();
        
        let dts = testItem.Format(undefined, StringLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Format with object parameter is an error', () => {
        let testItem = new StringLocalizedFormatter();
        
        let dts = testItem.Format({}, StringLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a string or primitive');
    });
});
describe('CapitalizeStringLocalizedFormatter', () => {

    test('Supports', () => {
        let testItem = new CapitalizeStringLocalizedFormatter();
        expect(testItem.Supports(CapitalizeStringLookupKey, 'en')).toBe(true);
        expect(testItem.Supports(CapitalizeStringLookupKey, 'fr')).toBe(true);    
        expect(testItem.Supports(NumberLookupKey, 'en')).toBe(false);   
        expect(testItem.Supports('anythingelse', 'en')).toBe(false);        
    });
    test('en: Format with string parameter', () => {
        let testItem = new CapitalizeStringLocalizedFormatter();
        let dts = testItem.Format('A', CapitalizeStringLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('A');
        expect(dts.ErrorMessage).toBeUndefined();

        dts = testItem.Format('a', CapitalizeStringLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('A');
        dts = testItem.Format('abc', CapitalizeStringLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('Abc');        
        dts = testItem.Format('', CapitalizeStringLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');               
    });

    test('fr: Format with string parameter', () => {
        let testItem = new CapitalizeStringLocalizedFormatter();
        let dts = testItem.Format('A', CapitalizeStringLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('A');
        expect(dts.ErrorMessage).toBeUndefined();
        dts = testItem.Format('a', CapitalizeStringLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('A');
        dts = testItem.Format('abc', CapitalizeStringLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('Abc');        
        dts = testItem.Format('', CapitalizeStringLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
    });    
    test('Format with number parameter is converted to string', () => {
        let testItem = new CapitalizeStringLocalizedFormatter();
        
        let dts = testItem.Format(15, CapitalizeStringLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('15');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Format with null parameter returns empty string', () => {
        let testItem = new CapitalizeStringLocalizedFormatter();
        
        let dts = testItem.Format(null, CapitalizeStringLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Format with undefined parameter returns empty string', () => {
        let testItem = new CapitalizeStringLocalizedFormatter();
        
        let dts = testItem.Format(undefined, CapitalizeStringLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Format with object parameter is an error', () => {
        let testItem = new CapitalizeStringLocalizedFormatter();
        
        let dts = testItem.Format({}, CapitalizeStringLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a string or primitive');
    });
});
describe('UppercaseStringLocalizedFormatter', () => {

    test('Supports', () => {
        let testItem = new UppercaseStringLocalizedFormatter();
        expect(testItem.Supports(UppercaseStringLookupKey, 'en')).toBe(true);
        expect(testItem.Supports(UppercaseStringLookupKey, 'fr')).toBe(true);    
        expect(testItem.Supports(NumberLookupKey, 'en')).toBe(false);   
        expect(testItem.Supports('anythingelse', 'en')).toBe(false);        
    });
    test('en: Format with string parameter', () => {
        let testItem = new UppercaseStringLocalizedFormatter();
        let dts = testItem.Format('A', UppercaseStringLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('A');
        expect(dts.ErrorMessage).toBeUndefined();

        dts = testItem.Format('a', UppercaseStringLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('A');
        dts = testItem.Format('ABC', UppercaseStringLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('ABC');           
        dts = testItem.Format('abc', UppercaseStringLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('ABC');        
        dts = testItem.Format('', UppercaseStringLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');               
    });

    test('fr: Format with string parameter', () => {
        let testItem = new UppercaseStringLocalizedFormatter();
        let dts = testItem.Format('A', UppercaseStringLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('A');
        expect(dts.ErrorMessage).toBeUndefined();
        dts = testItem.Format('a', UppercaseStringLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('A');
        dts = testItem.Format('ABC', UppercaseStringLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('ABC');          
        dts = testItem.Format('abc', UppercaseStringLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('ABC');        
        dts = testItem.Format('', UppercaseStringLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
    });    
    test('Format with number parameter is converted to string', () => {
        let testItem = new UppercaseStringLocalizedFormatter();
        
        let dts = testItem.Format(15, UppercaseStringLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('15');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Format with null parameter returns empty string', () => {
        let testItem = new UppercaseStringLocalizedFormatter();
        
        let dts = testItem.Format(null, UppercaseStringLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Format with undefined parameter returns empty string', () => {
        let testItem = new UppercaseStringLocalizedFormatter();
        
        let dts = testItem.Format(undefined, UppercaseStringLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Format with object parameter is an error', () => {
        let testItem = new UppercaseStringLocalizedFormatter();
        
        let dts = testItem.Format({}, UppercaseStringLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a string or primitive');
    });
});
describe('LowercaseStringLocalizedFormatter', () => {

    test('Supports', () => {
        let testItem = new LowercaseStringLocalizedFormatter();
        expect(testItem.Supports(LowercaseStringLookupKey, 'en')).toBe(true);
        expect(testItem.Supports(LowercaseStringLookupKey, 'fr')).toBe(true);    
        expect(testItem.Supports(NumberLookupKey, 'en')).toBe(false);   
        expect(testItem.Supports('anythingelse', 'en')).toBe(false);        
    });
    test('en: Format with string parameter', () => {
        let testItem = new LowercaseStringLocalizedFormatter();
        let dts = testItem.Format('A', LowercaseStringLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('a');
        expect(dts.ErrorMessage).toBeUndefined();

        dts = testItem.Format('a', LowercaseStringLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('a');
        dts = testItem.Format('ABC', LowercaseStringLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('abc');           
        dts = testItem.Format('abc', LowercaseStringLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('abc');        
        dts = testItem.Format('', LowercaseStringLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');               
    });

    test('fr: Format with string parameter', () => {
        let testItem = new LowercaseStringLocalizedFormatter();
        let dts = testItem.Format('A', LowercaseStringLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('a');
        expect(dts.ErrorMessage).toBeUndefined();
        dts = testItem.Format('a', LowercaseStringLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('a');
        dts = testItem.Format('ABC', LowercaseStringLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('abc');          
        dts = testItem.Format('abc', LowercaseStringLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('abc');        
        dts = testItem.Format('', LowercaseStringLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
    });    
    test('Format with number parameter is converted to string', () => {
        let testItem = new LowercaseStringLocalizedFormatter();
        
        let dts = testItem.Format(15, LowercaseStringLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('15');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Format with null parameter returns empty string', () => {
        let testItem = new LowercaseStringLocalizedFormatter();
        
        let dts = testItem.Format(null, LowercaseStringLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Format with undefined parameter returns empty string', () => {
        let testItem = new LowercaseStringLocalizedFormatter();
        
        let dts = testItem.Format(undefined, LowercaseStringLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Format with object parameter is an error', () => {
        let testItem = new LowercaseStringLocalizedFormatter();
        
        let dts = testItem.Format({}, LowercaseStringLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a string or primitive');
    });
});

describe('NumberLocalizedFormatter', () => {
    test('en: Supports NumberLookupKey is true, others false', () => {
        let testItem = new NumberLocalizedFormatter();
        
        expect(testItem.Supports(NumberLookupKey, 'en')).toBe(true);       
        expect(testItem.Supports('anythingelse', 'en')).toBe(false);              
    });
    test('Supports NumberLookupKey is true no matter the culture', () => {
        let testItem = new NumberLocalizedFormatter();
        
        expect(testItem.Supports(NumberLookupKey, 'fr')).toBe(true);        
        expect(testItem.Supports('anythingelse', 'fr')).toBe(false);
    });
    test('en culture with various valid numbers', () => {
        let testItem = new NumberLocalizedFormatter();
        
        let dts = testItem.Format(1, NumberLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(1.5, NumberLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1.5');
        dts = testItem.Format(1000000, NumberLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1,000,000');
        dts = testItem.Format(-9.50101, NumberLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('-9.501');
    });

    test('fr culture with various valid numbers', () => {
        let testItem = new NumberLocalizedFormatter();
        

        let dts = testItem.Format(1, NumberLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(1.5, NumberLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1,5');
        dts = testItem.Format(1000000, NumberLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1\u{202F}000\u{202F}000');
        dts = testItem.Format(-9.50101, NumberLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('-9,501');
    });    
    test('en culture with ways to output empty string', () => {
        let testItem = new NumberLocalizedFormatter();
        

        let dts = testItem.Format(null, NumberLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(undefined, NumberLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
    });
    test('Invalid type returns ErrorMessage', () => {
        let testItem = new NumberLocalizedFormatter();
        

        let dts = testItem.Format('A', NumberLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a number');
        
        dts = testItem.Format({}, NumberLookupKey, 'en');
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a number');
        
    });
});
describe('CurrencyLocalizedFormatter', () => {
    test('en: Supports CurrencyLookupKey is true. All others are false', () => {
        let testItem = new CurrencyLocalizedFormatter('USD');
        
        expect(testItem.Supports(CurrencyLookupKey, 'en')).toBe(true);       
        expect(testItem.Supports('anythingelse', 'en')).toBe(false);             
    });
    test('Supports CurrencyLookupKey is true in all cultures', () => {
        let testItem = new CurrencyLocalizedFormatter('USD');
        
        expect(testItem.Supports(CurrencyLookupKey, 'fr')).toBe(true);        
        expect(testItem.Supports('anythingelse', 'fr')).toBe(false);
    });

    test('en culture with various valid numbers, using currencycode USD from global default', () => {
        let testItem = new CurrencyLocalizedFormatter('USD');
        
        let dts = testItem.Format(1, CurrencyLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('$1.00');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(1.5, CurrencyLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('$1.50');
        dts = testItem.Format(1000000, CurrencyLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('$1,000,000.00');
        dts = testItem.Format(-9.50101, CurrencyLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('-$9.50');
    });

    test('fr culture with various valid numbers', () => {
        let testItem = new CurrencyLocalizedFormatter('USD', null,
            {
                'fr': 'EUR',
            });
        
        let dts = testItem.Format(1, CurrencyLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1,00\xA0€');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(1.5, CurrencyLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1,50\xA0€');
        dts = testItem.Format(1000000, CurrencyLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1\u{202F}000\u{202F}000,00\xA0€');
        dts = testItem.Format(-9.50101, CurrencyLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('-9,50\xA0€');
    });    
    test('fr-FR culture with various valid numbers', () => {
        let testItem = new CurrencyLocalizedFormatter('USD', null,
            {
                'fr-FR': 'EUR',
            });
        
        let dts = testItem.Format(1, CurrencyLookupKey, 'fr-FR');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1,00\xA0€');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(1.5, CurrencyLookupKey, 'fr-FR');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1,50\xA0€');
        dts = testItem.Format(1000000, CurrencyLookupKey, 'fr-FR');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1\u{202F}000\u{202F}000,00\xA0€');
        dts = testItem.Format(-9.50101, CurrencyLookupKey, 'fr-FR');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('-9,50\xA0€');
    });        
    test('When full culture is missing in constructor, fallback to countrycode culture', () => {
        let testItem = new CurrencyLocalizedFormatter('EUR', null,
            {
                'fr': 'EUR',
            });
        
        let dts = testItem.Format(1, CurrencyLookupKey, 'fr-FR');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1,00\xA0€');
        expect(dts.ErrorMessage).toBeUndefined();
    });       
    test('With global default currency code of USD and currencycode is missing in constructor, use default currency code', () => {
        let testItem = new CurrencyLocalizedFormatter('USD', null);
        
        let dts = testItem.Format(1, CurrencyLookupKey, 'fr-FR');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1,00\xA0$US'); // fr formatting, but US currency symbol
        expect(dts.ErrorMessage).toBeUndefined();

    });         
    test('With EUR as default currency code, CurrencyLookupKey uses EUR when currencycode is missing in constructor', () => {
        let testItem = new CurrencyLocalizedFormatter('EUR', null);
        
        let dts = testItem.Format(1, CurrencyLookupKey, 'fr-FR');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1,00\xA0€');
        expect(dts.ErrorMessage).toBeUndefined();
        // try english and get its formatting, but still uses the fr currency symbol
        dts = testItem.Format(1, CurrencyLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('€1.00');
        expect(dts.ErrorMessage).toBeUndefined();        
    });                    
    test('null and undefined input results in empty string', () => {
        let testItem = new CurrencyLocalizedFormatter('USD');
        
        let dts = testItem.Format(null, CurrencyLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(undefined, CurrencyLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
    });    
    test('Invalid type returns ErrorMessage', () => {
        let testItem = new CurrencyLocalizedFormatter('USD');
        
        let dts = testItem.Format('A', CurrencyLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a number');
        
        dts = testItem.Format({}, CurrencyLookupKey, 'en');
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a number');
        
    });    
});
describe('PercentageLocalizedFormatter', () => {
    test('en: Supports PercentageLookupKey is true. All others false', () => {
        let testItem = new PercentageLocalizedFormatter();
        
        expect(testItem.Supports(PercentageLookupKey, 'en')).toBe(true);        
        expect(testItem.Supports('anythingelse', 'en')).toBe(false);
    });
    test('all cultures: Supports PercentageLookupKey is true. All others false', () => {
        let testItem = new PercentageLocalizedFormatter();
        
        expect(testItem.Supports(PercentageLookupKey, 'fr')).toBe(true);        
        expect(testItem.Supports('anythingelse', 'fr')).toBe(false);
    });

    test('en culture with various valid numbers', () => {
        let testItem = new PercentageLocalizedFormatter();
        
        let dts = testItem.Format(1, PercentageLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('100%');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(0.15, PercentageLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('15%');
        dts = testItem.Format(1000, PercentageLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('100,000%');
        dts = testItem.Format(-0.09, PercentageLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('-9%');
    });

    test('fr culture with various valid numbers', () => {
        let testItem = new PercentageLocalizedFormatter();
        
        let dts = testItem.Format(1, PercentageLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('100\xA0%');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(0.15, PercentageLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('15\xA0%');
        dts = testItem.Format(1000, PercentageLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('100\u{202F}000\xA0%');
        dts = testItem.Format(-0.09, PercentageLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('-9\xA0%');
    });    
    test('null and undefined empty string', () => {
        let testItem = new PercentageLocalizedFormatter();
        
        let dts = testItem.Format(null, PercentageLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(undefined, PercentageLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
    });
    test('Invalid type returns ErrorMessage', () => {
        let testItem = new PercentageLocalizedFormatter();
        
        let dts = testItem.Format('A', PercentageLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a number');
        
        dts = testItem.Format({}, PercentageLookupKey, 'en');
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a number');
        
    });
});


describe('Percentage100LocalizedFormatter', () => {
    test('en: Supports Percentage100LookupKey is true. All others false', () => {
        let testItem = new Percentage100LocalizedFormatter();
        
        expect(testItem.Supports(Percentage100LookupKey, 'en')).toBe(true);        
        expect(testItem.Supports('anythingelse', 'en')).toBe(false);
    });
    test('all cultures: Supports Percentage100LookupKey is true. All others false', () => {
        let testItem = new Percentage100LocalizedFormatter();
        
        expect(testItem.Supports(Percentage100LookupKey, 'fr')).toBe(true);        
        expect(testItem.Supports('anythingelse', 'fr')).toBe(false);
    });

    test('en culture with various valid numbers', () => {
        let testItem = new Percentage100LocalizedFormatter();
        
        let dts = testItem.Format(100, Percentage100LookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('100%');
        expect(dts.ErrorMessage).toBeUndefined();
        // Intl rounds percentage by default.
        dts = testItem.Format(15.2, Percentage100LookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('15%');
        dts = testItem.Format(15.5, Percentage100LookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('16%');
        dts = testItem.Format(1000, Percentage100LookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1,000%');
        dts = testItem.Format(-9, Percentage100LookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('-9%');
    });

    test('fr culture with various valid numbers', () => {
        let testItem = new Percentage100LocalizedFormatter();
        
        let dts = testItem.Format(100, Percentage100LookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('100\xA0%');
        expect(dts.ErrorMessage).toBeUndefined();
        // Intl rounds percentage by default
        dts = testItem.Format(15.2, Percentage100LookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('15\xA0%');
        dts = testItem.Format(15.5, Percentage100LookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('16\xA0%');        
        dts = testItem.Format(1000, Percentage100LookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1\u{202F}000\xA0%');
        dts = testItem.Format(-9, Percentage100LookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('-9\xA0%');
    });    
    test('null and undefined empty string', () => {
        let testItem = new Percentage100LocalizedFormatter();
        
        let dts = testItem.Format(null, Percentage100LookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(undefined, Percentage100LookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
    });
    test('Invalid type returns ErrorMessage', () => {
        let testItem = new Percentage100LocalizedFormatter();
        
        let dts = testItem.Format('A', Percentage100LookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a number');
        
        dts = testItem.Format({}, Percentage100LookupKey, 'en');
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a number');
    });
});

describe('BooleanLocalizedFormatter', () => {
    test('en culture supports BooleanLookupKey is true. All others are false', () => {
        let testItem = new BooleanLocalizedFormatter();
        
        expect(testItem.Supports(BooleanLookupKey, 'en')).toBe(true);        
        expect(testItem.Supports('anylookupkey', 'en')).toBe(false);
    });
    test('any culture supports BooleanLookupKey is true. All others are false', () => {
        let testItem = new BooleanLocalizedFormatter();
        
        expect(testItem.Supports(BooleanLookupKey, 'fr')).toBe(true);        
        expect(testItem.Supports('anylookupkey', 'fr')).toBe(false);
    });

    test('Without CultureToBooleanLabels, true and false are "true" and "false"', () => {
        let testItem = new BooleanLocalizedFormatter();
        
        let dts = testItem.Format(true, BooleanLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('true');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(false, BooleanLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('false');
    });
    test('CultureToBooleanLabels are used when culture is specified and true/false used for another culture', () => {
        let testItem = new BooleanLocalizedFormatter([
            {
                CultureId: 'es',
                TrueLabel: 'esTRUE',
                FalseLabel: 'esFALSE'
            },
            {
                CultureId: 'es-SP',
                TrueLabel: 'esSPTRUE',
                FalseLabel: 'esSPFALSE'
            },
            {
                CultureId: 'en-US',
                TrueLabel: 'USTRUE',
                FalseLabel: 'USFALSE'
            }
        ]);
        
        let dts = testItem.Format(true, BooleanLookupKey, 'en');    // uses global default
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('true');
        expect(dts.ErrorMessage).toBeUndefined();
        dts = testItem.Format(false, BooleanLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('false');
        expect(dts.ErrorMessage).toBeUndefined();

        dts = testItem.Format(true, BooleanLookupKey, 'en-US');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('USTRUE');
        expect(dts.ErrorMessage).toBeUndefined();
        dts = testItem.Format(false, BooleanLookupKey, 'en-US');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('USFALSE');        
        expect(dts.ErrorMessage).toBeUndefined();       
        
        dts = testItem.Format(true, BooleanLookupKey, 'en-GB'); // fallback to global default
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('true');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(false, BooleanLookupKey, 'en-GB');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('false');

        dts = testItem.Format(true, BooleanLookupKey, 'es'); 
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('esTRUE');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(false, BooleanLookupKey, 'es');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('esFALSE');        

        dts = testItem.Format(true, BooleanLookupKey, 'es-SP'); 
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('esSPTRUE');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(false, BooleanLookupKey, 'es-SP');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('esSPFALSE');    

        dts = testItem.Format(true, BooleanLookupKey, 'es-MX'); // fallback to es
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('esTRUE');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(false, BooleanLookupKey, 'es-MX');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('esFALSE');                
    });    
    test('null or undefined returns empty string', () => {
        let testItem = new BooleanLocalizedFormatter();
        
        let dts = testItem.Format(null, BooleanLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(undefined, BooleanLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
    });    
    test('Invalid type returns ErrorMessage', () => {
        let testItem = new BooleanLocalizedFormatter();
        
        let dts = testItem.Format('A', BooleanLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a boolean');
        
        dts = testItem.Format(1, BooleanLookupKey, 'en');
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a boolean');
        
    });
});
describe('YesNoBooleanLocalizedFormatter', () => {
    test('en culture supports YesNoBooleanLookupKey is true. All others are false', () => {
        let testItem = new YesNoBooleanLocalizedFormatter();
        
        expect(testItem.Supports(YesNoBooleanLookupKey, 'en')).toBe(true);        
        expect(testItem.Supports('anylookupkey', 'en')).toBe(false);
    });
    test('any culture supports YesNoBooleanLookupKey is true. All others are false', () => {
        let testItem = new YesNoBooleanLocalizedFormatter();
        
        expect(testItem.Supports(YesNoBooleanLookupKey, 'fr')).toBe(true);        
        expect(testItem.Supports('anylookupkey', 'fr')).toBe(false);
    });

    test('Without CultureToYesNoBooleanLabels, true and false are "yes" and "no"', () => {
        let testItem = new YesNoBooleanLocalizedFormatter();
        
        let dts = testItem.Format(true, YesNoBooleanLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('yes');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(false, YesNoBooleanLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('no');
    });
    test('CultureToYesNoBooleanLabels are used when culture is specified and true/false used for another culture', () => {
        let testItem = new YesNoBooleanLocalizedFormatter([
            {
                CultureId: 'es',
                TrueLabel: 'sí',
                FalseLabel: 'no'
            },
            {
                CultureId: 'es-SP',
                TrueLabel: 'esSP sí',
                FalseLabel: 'esSP no'
            },
            {
                CultureId: 'en-US',
                TrueLabel: 'US YES',
                FalseLabel: 'US NO'
            }
        ]);
        
        let dts = testItem.Format(true, YesNoBooleanLookupKey, 'en');    // uses global default
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('yes');
        expect(dts.ErrorMessage).toBeUndefined();
        dts = testItem.Format(false, YesNoBooleanLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('no');
        expect(dts.ErrorMessage).toBeUndefined();

        dts = testItem.Format(true, YesNoBooleanLookupKey, 'en-US');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('US YES');
        expect(dts.ErrorMessage).toBeUndefined();
        dts = testItem.Format(false, YesNoBooleanLookupKey, 'en-US');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('US NO');        
        expect(dts.ErrorMessage).toBeUndefined();       
        
        dts = testItem.Format(true, YesNoBooleanLookupKey, 'en-GB'); // fallback to global default
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('yes');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(false, YesNoBooleanLookupKey, 'en-GB');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('no');

        dts = testItem.Format(true, BooleanLookupKey, 'es'); 
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('sí');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(false, BooleanLookupKey, 'es');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('no');        

        dts = testItem.Format(true, BooleanLookupKey, 'es-SP'); 
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('esSP sí');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(false, BooleanLookupKey, 'es-SP');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('esSP no');    

        dts = testItem.Format(true, BooleanLookupKey, 'es-MX'); // fallback to es
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('sí');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(false, BooleanLookupKey, 'es-MX');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('no');         
        
        dts = testItem.Format(true, BooleanLookupKey, 'de'); // fallback to es
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('yes');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(false, BooleanLookupKey, 'de');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('no');                    
    });    
    test('null or undefined returns empty string', () => {
        let testItem = new YesNoBooleanLocalizedFormatter();
        
        let dts = testItem.Format(null, YesNoBooleanLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(undefined, YesNoBooleanLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
    });    
    test('Invalid type returns ErrorMessage', () => {
        let testItem = new YesNoBooleanLocalizedFormatter();
        
        let dts = testItem.Format('A', YesNoBooleanLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a boolean');
        
        dts = testItem.Format(1, YesNoBooleanLookupKey, 'en');
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a boolean');
        
    });
});

describe('DateTimeLocalizedFormatter', () => {
    test('en: Supports DateTimeLookupKey is true. Others are false', () => {
        let testItem = new DateTimeLocalizedFormatter();
        
        expect(testItem.Supports(DateTimeLookupKey, 'en')).toBe(true);        
        expect(testItem.Supports('anythingelse', 'en')).toBe(false);
    });
    test('any culture: Supports DateTimeLookupKey is true. Others are false', () => {
        let testItem = new DateTimeLocalizedFormatter();
        
        expect(testItem.Supports(DateTimeLookupKey, 'fr')).toBe(true);        
        expect(testItem.Supports('otherlookupkeys', 'fr')).toBe(false);
    });

    test('en culture with various valid dates', () => {
        let testItem = new DateTimeLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.Format(date1, DateTimeLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('10/31/2000, 12:00 AM');
        expect(dts.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dts = testItem.Format(date2, DateTimeLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1/1/1980, 4:00 AM');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dts = testItem.Format(date3, DateTimeLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1/15/1980, 4:04 PM');
    });

    test('fr culture with various valid dates', () => {
        let testItem = new DateTimeLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.Format(date1, DateTimeLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('31/10/2000 00:00');
        expect(dts.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dts = testItem.Format(date2, DateTimeLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('01/01/1980 04:00');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dts = testItem.Format(date3, DateTimeLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('15/01/1980 16:04');
    });    
    test('null or undefined return empty string', () => {
        let testItem = new DateTimeLocalizedFormatter();
        
        let dts = testItem.Format(null, DateTimeLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(undefined, DateTimeLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Calues other than Date, null or undefined are errors', () => {
        let testItem = new DateTimeLocalizedFormatter();
        
        let dts = testItem.Format({}, DateTimeLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
        
        dts = testItem.Format('', DateTimeLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
        
        dts = testItem.Format(10, DateTimeLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
            
        dts = testItem.Format(true, DateTimeLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
                
    });
});
describe('DateLocalizedFormatter', () => {
    test('en: Supports DateLookupKey is true. Others are false', () => {
        let testItem = new DateLocalizedFormatter();
        
        expect(testItem.Supports(DateLookupKey, 'en')).toBe(true);        
        expect(testItem.Supports('otherlookupkey', 'en')).toBe(false);
    });
    test('all cultures: Supports DateLookupKey is true. Others are false', () => {
        let testItem = new DateLocalizedFormatter();
        
        expect(testItem.Supports(DateLookupKey, 'fr')).toBe(true);        
        expect(testItem.Supports('otherlookupkey', 'fr')).toBe(false);
    });

    test('en culture with various valid dates', () => {
        let testItem = new DateLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.Format(date1, DateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('10/31/2000');
        expect(dts.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dts = testItem.Format(date2, DateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1/1/1980');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dts = testItem.Format(date3, DateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1/15/1980');
    });

    test('fr culture with various valid dates', () => {
        let testItem = new DateLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.Format(date1, DateLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('31/10/2000');
        expect(dts.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dts = testItem.Format(date2, DateLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('01/01/1980');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dts = testItem.Format(date3, DateLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('15/01/1980');
    });    
    test('null or undefined returns empty string', () => {
        let testItem = new DateLocalizedFormatter();
        
        let dts = testItem.Format(null, DateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(undefined, DateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Values other than Date, null or undefined are errors', () => {
        let testItem = new DateLocalizedFormatter();
        
        let dts = testItem.Format({}, DateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
        
        dts = testItem.Format('', DateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
        
        dts = testItem.Format(10, DateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
            
        dts = testItem.Format(true, DateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
                
    });

});
describe('AbbrevDateLocalizedFormatter', () => {
    test('en: Supports AbbrevDateLookupKey is true. Others are false', () => {
        let testItem = new AbbrevDateLocalizedFormatter();
        
        expect(testItem.Supports(AbbrevDateLookupKey, 'en')).toBe(true);        
        expect(testItem.Supports('otherlookupkey', 'en')).toBe(false);        
    });
    test('fr: Supports AbbrevDateLookupKey is true. Others are false', () => {
        let testItem = new AbbrevDateLocalizedFormatter();
        
        expect(testItem.Supports(AbbrevDateLookupKey, 'fr')).toBe(true);        
        expect(testItem.Supports('otherlookupkey', 'fr')).toBe(false);        
    });
    test('en culture with various valid dates', () => {
        let testItem = new AbbrevDateLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.Format(date1, AbbrevDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('Oct 31, 2000');
        expect(dts.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dts = testItem.Format(date2, AbbrevDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('Jan 1, 1980');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dts = testItem.Format(date3, AbbrevDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('Jan 15, 1980');
    });

    test('fr culture with various valid dates', () => {
        let testItem = new AbbrevDateLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.Format(date1, AbbrevDateLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('31 oct. 2000');
        expect(dts.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dts = testItem.Format(date2, AbbrevDateLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1 janv. 1980');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dts = testItem.Format(date3, AbbrevDateLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('15 janv. 1980');
    });    
    test('null or undefined returns empty string', () => {
        let testItem = new AbbrevDateLocalizedFormatter();
        
        let dts = testItem.Format(null, AbbrevDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(undefined, AbbrevDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Values other than Date, null or undefined are errors', () => {
        let testItem = new AbbrevDateLocalizedFormatter();
        
        let dts = testItem.Format({}, AbbrevDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
        
        dts = testItem.Format('', AbbrevDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
        
        dts = testItem.Format(10, AbbrevDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
            
        dts = testItem.Format(true, AbbrevDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
                
    });
});
describe('AbbrevDOWDateLocalizedFormatter', () => {
    test('en: Supports AbbrevDOWDateLookupKey is true. Others are false', () => {
        let testItem = new AbbrevDOWDateLocalizedFormatter();
        
        expect(testItem.Supports(AbbrevDOWDateLookupKey, 'en')).toBe(true);        
        expect(testItem.Supports('otherlookupkey', 'en')).toBe(false);
    });
    test('all cultures: Supports AbbrevDOWDateLookupKey is true. Others are false', () => {
        let testItem = new AbbrevDOWDateLocalizedFormatter();
        
        expect(testItem.Supports(AbbrevDOWDateLookupKey, 'fr')).toBe(true);        
        expect(testItem.Supports('otherlookupkey', 'fr')).toBe(false);        
    });

    test('en culture with various valid dates', () => {
        let testItem = new AbbrevDOWDateLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.Format(date1, AbbrevDOWDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('Tue, Oct 31, 2000');
        expect(dts.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 2, 4, 0, 30);
        dts = testItem.Format(date2, AbbrevDOWDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('Wed, Jan 2, 1980');
        let date3 = new Date(1980, 0, 18, 16, 4, 0);        
        dts = testItem.Format(date3, AbbrevDOWDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('Fri, Jan 18, 1980');
    });

    test('fr culture with various valid dates', () => {
        let testItem = new AbbrevDOWDateLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.Format(date1, AbbrevDOWDateLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('mar. 31 oct. 2000');
        expect(dts.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 3, 4, 0, 30);
        dts = testItem.Format(date2, AbbrevDOWDateLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('jeu. 3 janv. 1980');
        let date3 = new Date(1980, 0, 18, 16, 4, 0);        
        dts = testItem.Format(date3, AbbrevDOWDateLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('ven. 18 janv. 1980');
    });    
    test('Null or undefined returns empty string', () => {
        let testItem = new AbbrevDOWDateLocalizedFormatter();
        
        let dts = testItem.Format(null, AbbrevDOWDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(undefined, AbbrevDOWDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Values other than Date, null or undefined are errors', () => {
        let testItem = new AbbrevDOWDateLocalizedFormatter();
        
        let dts = testItem.Format({}, AbbrevDOWDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
        
        dts = testItem.Format('', AbbrevDOWDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
        
        dts = testItem.Format(10, AbbrevDOWDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
            
        dts = testItem.Format(true, AbbrevDOWDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
                
    });    
});
describe('LongDateLocalizedFormatter', () => {
    test('en: Supports LongDateLookupKey is true. Others are false', () => {
        let testItem = new LongDateLocalizedFormatter();
        
        expect(testItem.Supports(LongDateLookupKey, 'en')).toBe(true);        
        expect(testItem.Supports('otherlookupkey', 'en')).toBe(false);        
    });
    test('fr: Supports LongDateLookupKey is true. Others are false', () => {
        let testItem = new LongDateLocalizedFormatter();
        
        expect(testItem.Supports(LongDateLookupKey, 'fr')).toBe(true);        
        expect(testItem.Supports('otherlookupkey', 'fr')).toBe(false);        
    });
    test('en culture with various valid dates', () => {
        let testItem = new LongDateLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.Format(date1, LongDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('October 31, 2000');
        expect(dts.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dts = testItem.Format(date2, LongDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('January 1, 1980');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dts = testItem.Format(date3, LongDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('January 15, 1980');
    });

    test('fr culture with various valid dates', () => {
        let testItem = new LongDateLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.Format(date1, LongDateLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('31 octobre 2000');
        expect(dts.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dts = testItem.Format(date2, LongDateLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1 janvier 1980');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dts = testItem.Format(date3, LongDateLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('15 janvier 1980');
    });    
    test('null or undefined returns empty string', () => {
        let testItem = new LongDateLocalizedFormatter();
        
        let dts = testItem.Format(null, LongDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(undefined, LongDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Values other than Date, null or undefined are errors', () => {
        let testItem = new LongDateLocalizedFormatter();
        
        let dts = testItem.Format({}, LongDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
        
        dts = testItem.Format('', LongDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
        
        dts = testItem.Format(10, LongDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
            
        dts = testItem.Format(true, LongDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
                
    });
});
describe('LongDOWDateLocalizedFormatter', () => {
    test('en: Supports LongDOWDateLookupKey is true. Others are false', () => {
        let testItem = new LongDOWDateLocalizedFormatter();
        
        expect(testItem.Supports(LongDOWDateLookupKey, 'en')).toBe(true);        
        expect(testItem.Supports('otherlookupkey', 'en')).toBe(false);        
    });
    test('fr: Supports LongDOWDateLookupKey is true. Others are false', () => {
        let testItem = new LongDOWDateLocalizedFormatter();
        
        expect(testItem.Supports(LongDOWDateLookupKey, 'fr')).toBe(true);        
        expect(testItem.Supports('otherlookupkey', 'fr')).toBe(false);
    });

    test('en culture with various valid dates', () => {
        let testItem = new LongDOWDateLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.Format(date1, LongDOWDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('Tuesday, October 31, 2000');
        expect(dts.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 2, 4, 0, 30);
        dts = testItem.Format(date2, LongDOWDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('Wednesday, January 2, 1980');
        let date3 = new Date(1980, 0, 18, 16, 4, 0);        
        dts = testItem.Format(date3, LongDOWDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('Friday, January 18, 1980');
    });

    test('fr culture with various valid dates', () => {
        let testItem = new LongDOWDateLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.Format(date1, LongDOWDateLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('mardi 31 octobre 2000');
        expect(dts.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 3, 4, 0, 30);
        dts = testItem.Format(date2, LongDOWDateLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('jeudi 3 janvier 1980');
        let date3 = new Date(1980, 0, 18, 16, 4, 0);        
        dts = testItem.Format(date3, LongDOWDateLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('vendredi 18 janvier 1980');
    });    
    test('null or undefined returns empty string', () => {
        let testItem = new LongDOWDateLocalizedFormatter();
        
        let dts = testItem.Format(null, LongDOWDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(undefined, LongDOWDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Values other than Date, null or undefined are errors', () => {
        let testItem = new LongDOWDateLocalizedFormatter();
        
        let dts = testItem.Format({}, LongDOWDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
        
        dts = testItem.Format('', LongDOWDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
        
        dts = testItem.Format(10, LongDOWDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
            
        dts = testItem.Format(true, LongDOWDateLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
                
    });        
});
describe('TimeofDayLocalizedFormatter', () => {
    test('en: Supports TimeOfDayLookupKey is true. Others are false', () => {
        let testItem = new TimeofDayLocalizedFormatter();
        
        expect(testItem.Supports(TimeOfDayLookupKey, 'en')).toBe(true);        
        expect(testItem.Supports('otherlookupkey', 'en')).toBe(false);        
    });
    test('other cultures: Supports TimeOfDayLookupKey is true. Others are false', () => {
        let testItem = new TimeofDayLocalizedFormatter();
        
        expect(testItem.Supports(TimeOfDayLookupKey, 'otherculture')).toBe(true);        
        expect(testItem.Supports('otherlookupkey', 'otherculture')).toBe(false);        
    });
    test('en culture with various valid dates', () => {
        let testItem = new TimeofDayLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.Format(date1, TimeOfDayLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('12:00 AM');
        expect(dts.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dts = testItem.Format(date2, TimeOfDayLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('4:00 AM');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dts = testItem.Format(date3, TimeOfDayLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('4:04 PM');
    });

    test('fr culture with various valid dates', () => {
        let testItem = new TimeofDayLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.Format(date1, TimeOfDayLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('00:00');
        expect(dts.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dts = testItem.Format(date2, TimeOfDayLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('04:00');
        
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dts = testItem.Format(date3, TimeOfDayLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('16:04');
    });    
    test('null or undefined returns empty string', () => {
        let testItem = new TimeofDayLocalizedFormatter();
        
        let dts = testItem.Format(null, TimeOfDayLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(undefined, TimeOfDayLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('values other than Date, null or undefined are errors', () => {
        let testItem = new TimeofDayLocalizedFormatter();
        
        let dts = testItem.Format({}, TimeOfDayLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
        
        dts = testItem.Format('', TimeOfDayLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
        
        dts = testItem.Format(10, TimeOfDayLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
            
        dts = testItem.Format(true, TimeOfDayLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
                
    });    
});
describe('TimeofDayHMSLocalizedFormatter', () => {
    test('en: Supports TimeOfDayHMSLookupKey is true. Others are false', () => {
        let testItem = new TimeofDayHMSLocalizedFormatter();
        
        expect(testItem.Supports(TimeOfDayHMSLookupKey, 'en')).toBe(true);        
        expect(testItem.Supports('otherlookupkey', 'en')).toBe(false);        
    });
    test('other culture: Supports TimeOfDayHMSLookupKey is true. Others are false', () => {
        let testItem = new TimeofDayHMSLocalizedFormatter();
        
        expect(testItem.Supports(TimeOfDayHMSLookupKey, 'otherculture')).toBe(true);        
        expect(testItem.Supports('otherlookupkey', 'otherculture')).toBe(false);        
    });

    test('fr culture with various valid dates', () => {
        let testItem = new TimeofDayHMSLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.Format(date1, TimeOfDayHMSLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('00:00:00');
        expect(dts.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dts = testItem.Format(date2, TimeOfDayHMSLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('04:00:30');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dts = testItem.Format(date3, TimeOfDayHMSLookupKey, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('16:04:00');
    });    
    test('null or undefined returns empty string', () => {
        let testItem = new TimeofDayHMSLocalizedFormatter();
        
        let dts = testItem.Format(null, TimeOfDayHMSLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(undefined, TimeOfDayHMSLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Values other than Date, null or undefined are errors', () => {
        let testItem = new TimeofDayHMSLocalizedFormatter();
        
        let dts = testItem.Format({}, TimeOfDayHMSLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
        
        dts = testItem.Format('', TimeOfDayHMSLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
        
        dts = testItem.Format(10, TimeOfDayHMSLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
            
        dts = testItem.Format(true, TimeOfDayHMSLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
                
    });        
});