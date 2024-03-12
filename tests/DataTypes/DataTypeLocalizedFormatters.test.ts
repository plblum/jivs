import { AbbrevDOWDateLocalizedFormatter, AbbrevDateLocalizedFormatter, BooleanLocalizedFormatter, CapitalizeStringLocalizedFormatter, CurrencyLocalizedFormatter, DateLocalizedFormatter, DateTimeLocalizedFormatter, LongDOWDateLocalizedFormatter, LongDateLocalizedFormatter, LowercaseStringLocalizedFormatter, NumberLocalizedFormatter, Percentage100LocalizedFormatter, PercentageLocalizedFormatter, StringLocalizedFormatter, TimeofDayHMSLocalizedFormatter, TimeofDayLocalizedFormatter, UppercaseStringLocalizedFormatter, YesNoBooleanLocalizedFormatter } from './../../src/DataTypes/DataTypeLocalizedFormatters';
import {
    StringLookupKey, CapitalizeStringLookupKey, UppercaseStringLookupKey, LowercaseStringLookupKey,
    NumberLookupKey, CurrencyLookupKey, PercentageLookupKey, BooleanLookupKey, YesNoBooleanLookupKey, DateTimeLookupKey, DateLookupKey,
    AbbrevDateLookupKey, AbbrevDOWDateLookupKey, LongDateLookupKey, LongDOWDateLookupKey, TimeOfDayLookupKey, TimeOfDayHMSLookupKey, Percentage100LookupKey
} from "../../src/DataTypes/LookupKeys";
import { ResetValGlobals, valGlobals } from '../../src/Services/ValidationGlobals';

beforeEach(() => {
    ResetValGlobals(); 
});
afterEach(() => {
    ResetValGlobals(); 
});

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
        let dtr = testItem.Format('A', StringLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('A');
        expect(dtr.ErrorMessage).toBeUndefined();
    });

    test('fr: Format with string parameter', () => {
        let testItem = new StringLocalizedFormatter();
        let dtr = testItem.Format('A', StringLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('A');
        expect(dtr.ErrorMessage).toBeUndefined();
    });    
    test('Format with number parameter is converted to string', () => {
        let testItem = new StringLocalizedFormatter();
        
        let dtr = testItem.Format(15, StringLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('15');
        expect(dtr.ErrorMessage).toBeUndefined();
        
    });
    test('Format with null parameter returns empty string', () => {
        let testItem = new StringLocalizedFormatter();
        
        let dtr = testItem.Format(null, StringLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
    });
    test('Format with undefined parameter returns empty string', () => {
        let testItem = new StringLocalizedFormatter();
        
        let dtr = testItem.Format(undefined, StringLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
    });
    test('Format with object parameter is an error', () => {
        let testItem = new StringLocalizedFormatter();
        
        let dtr = testItem.Format({}, StringLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a string or primitive');
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
        let dtr = testItem.Format('A', CapitalizeStringLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('A');
        expect(dtr.ErrorMessage).toBeUndefined();

        dtr = testItem.Format('a', CapitalizeStringLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('A');
        dtr = testItem.Format('abc', CapitalizeStringLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('Abc');        
        dtr = testItem.Format('', CapitalizeStringLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');               
    });

    test('fr: Format with string parameter', () => {
        let testItem = new CapitalizeStringLocalizedFormatter();
        let dtr = testItem.Format('A', CapitalizeStringLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('A');
        expect(dtr.ErrorMessage).toBeUndefined();
        dtr = testItem.Format('a', CapitalizeStringLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('A');
        dtr = testItem.Format('abc', CapitalizeStringLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('Abc');        
        dtr = testItem.Format('', CapitalizeStringLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
    });    
    test('Format with number parameter is converted to string', () => {
        let testItem = new CapitalizeStringLocalizedFormatter();
        
        let dtr = testItem.Format(15, CapitalizeStringLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('15');
        expect(dtr.ErrorMessage).toBeUndefined();
        
    });
    test('Format with null parameter returns empty string', () => {
        let testItem = new CapitalizeStringLocalizedFormatter();
        
        let dtr = testItem.Format(null, CapitalizeStringLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
    });
    test('Format with undefined parameter returns empty string', () => {
        let testItem = new CapitalizeStringLocalizedFormatter();
        
        let dtr = testItem.Format(undefined, CapitalizeStringLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
    });
    test('Format with object parameter is an error', () => {
        let testItem = new CapitalizeStringLocalizedFormatter();
        
        let dtr = testItem.Format({}, CapitalizeStringLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a string or primitive');
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
        let dtr = testItem.Format('A', UppercaseStringLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('A');
        expect(dtr.ErrorMessage).toBeUndefined();

        dtr = testItem.Format('a', UppercaseStringLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('A');
        dtr = testItem.Format('ABC', UppercaseStringLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('ABC');           
        dtr = testItem.Format('abc', UppercaseStringLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('ABC');        
        dtr = testItem.Format('', UppercaseStringLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');               
    });

    test('fr: Format with string parameter', () => {
        let testItem = new UppercaseStringLocalizedFormatter();
        let dtr = testItem.Format('A', UppercaseStringLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('A');
        expect(dtr.ErrorMessage).toBeUndefined();
        dtr = testItem.Format('a', UppercaseStringLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('A');
        dtr = testItem.Format('ABC', UppercaseStringLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('ABC');          
        dtr = testItem.Format('abc', UppercaseStringLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('ABC');        
        dtr = testItem.Format('', UppercaseStringLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
    });    
    test('Format with number parameter is converted to string', () => {
        let testItem = new UppercaseStringLocalizedFormatter();
        
        let dtr = testItem.Format(15, UppercaseStringLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('15');
        expect(dtr.ErrorMessage).toBeUndefined();
        
    });
    test('Format with null parameter returns empty string', () => {
        let testItem = new UppercaseStringLocalizedFormatter();
        
        let dtr = testItem.Format(null, UppercaseStringLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
    });
    test('Format with undefined parameter returns empty string', () => {
        let testItem = new UppercaseStringLocalizedFormatter();
        
        let dtr = testItem.Format(undefined, UppercaseStringLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
    });
    test('Format with object parameter is an error', () => {
        let testItem = new UppercaseStringLocalizedFormatter();
        
        let dtr = testItem.Format({}, UppercaseStringLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a string or primitive');
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
        let dtr = testItem.Format('A', LowercaseStringLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('a');
        expect(dtr.ErrorMessage).toBeUndefined();

        dtr = testItem.Format('a', LowercaseStringLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('a');
        dtr = testItem.Format('ABC', LowercaseStringLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('abc');           
        dtr = testItem.Format('abc', LowercaseStringLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('abc');        
        dtr = testItem.Format('', LowercaseStringLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');               
    });

    test('fr: Format with string parameter', () => {
        let testItem = new LowercaseStringLocalizedFormatter();
        let dtr = testItem.Format('A', LowercaseStringLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('a');
        expect(dtr.ErrorMessage).toBeUndefined();
        dtr = testItem.Format('a', LowercaseStringLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('a');
        dtr = testItem.Format('ABC', LowercaseStringLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('abc');          
        dtr = testItem.Format('abc', LowercaseStringLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('abc');        
        dtr = testItem.Format('', LowercaseStringLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
    });    
    test('Format with number parameter is converted to string', () => {
        let testItem = new LowercaseStringLocalizedFormatter();
        
        let dtr = testItem.Format(15, LowercaseStringLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('15');
        expect(dtr.ErrorMessage).toBeUndefined();
        
    });
    test('Format with null parameter returns empty string', () => {
        let testItem = new LowercaseStringLocalizedFormatter();
        
        let dtr = testItem.Format(null, LowercaseStringLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
    });
    test('Format with undefined parameter returns empty string', () => {
        let testItem = new LowercaseStringLocalizedFormatter();
        
        let dtr = testItem.Format(undefined, LowercaseStringLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
    });
    test('Format with object parameter is an error', () => {
        let testItem = new LowercaseStringLocalizedFormatter();
        
        let dtr = testItem.Format({}, LowercaseStringLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a string or primitive');
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
        
        let dtr = testItem.Format(1, NumberLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = testItem.Format(1.5, NumberLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1.5');
        dtr = testItem.Format(1000000, NumberLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1,000,000');
        dtr = testItem.Format(-9.50101, NumberLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('-9.501');
    });

    test('fr culture with various valid numbers', () => {
        let testItem = new NumberLocalizedFormatter();
        

        let dtr = testItem.Format(1, NumberLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = testItem.Format(1.5, NumberLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1,5');
        dtr = testItem.Format(1000000, NumberLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1\u{202F}000\u{202F}000');
        dtr = testItem.Format(-9.50101, NumberLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('-9,501');
    });    
    test('en culture with ways to output empty string', () => {
        let testItem = new NumberLocalizedFormatter();
        

        let dtr = testItem.Format(null, NumberLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = testItem.Format(undefined, NumberLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
    });
    test('Invalid type returns ErrorMessage', () => {
        let testItem = new NumberLocalizedFormatter();
        

        let dtr = testItem.Format('A', NumberLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a number');
        
        dtr = testItem.Format({}, NumberLookupKey, 'en');
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a number');
        
    });
});
describe('CurrencyLocalizedFormatter', () => {
    test('en: Supports CurrencyLookupKey is true. All others are false', () => {
        let testItem = new CurrencyLocalizedFormatter();
        
        expect(testItem.Supports(CurrencyLookupKey, 'en')).toBe(true);       
        expect(testItem.Supports('anythingelse', 'en')).toBe(false);             
    });
    test('Supports CurrencyLookupKey is true in all cultures', () => {
        let testItem = new CurrencyLocalizedFormatter();
        
        expect(testItem.Supports(CurrencyLookupKey, 'fr')).toBe(true);        
        expect(testItem.Supports('anythingelse', 'fr')).toBe(false);
    });

    test('en culture with various valid numbers, using currencycode USD from global default', () => {
        let testItem = new CurrencyLocalizedFormatter();
        
        let dtr = testItem.Format(1, CurrencyLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('$1.00');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = testItem.Format(1.5, CurrencyLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('$1.50');
        dtr = testItem.Format(1000000, CurrencyLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('$1,000,000.00');
        dtr = testItem.Format(-9.50101, CurrencyLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('-$9.50');
    });

    test('fr culture with various valid numbers', () => {
        let testItem = new CurrencyLocalizedFormatter(null,
            {
                'fr': 'EUR',
            });
        
        let dtr = testItem.Format(1, CurrencyLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1,00\xA0€');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = testItem.Format(1.5, CurrencyLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1,50\xA0€');
        dtr = testItem.Format(1000000, CurrencyLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1\u{202F}000\u{202F}000,00\xA0€');
        dtr = testItem.Format(-9.50101, CurrencyLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('-9,50\xA0€');
    });    
    test('fr-FR culture with various valid numbers', () => {
        let testItem = new CurrencyLocalizedFormatter(null,
            {
                'fr-FR': 'EUR',
            });
        
        let dtr = testItem.Format(1, CurrencyLookupKey, 'fr-FR');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1,00\xA0€');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = testItem.Format(1.5, CurrencyLookupKey, 'fr-FR');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1,50\xA0€');
        dtr = testItem.Format(1000000, CurrencyLookupKey, 'fr-FR');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1\u{202F}000\u{202F}000,00\xA0€');
        dtr = testItem.Format(-9.50101, CurrencyLookupKey, 'fr-FR');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('-9,50\xA0€');
    });        
    test('When full culture is missing in constructor, fallback to countrycode culture', () => {
        let testItem = new CurrencyLocalizedFormatter(null,
            {
                'fr': 'EUR',
            });
        
        let dtr = testItem.Format(1, CurrencyLookupKey, 'fr-FR');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1,00\xA0€');
        expect(dtr.ErrorMessage).toBeUndefined();
    });       
    test('With global default currency code of USD and currencycode is missing in constructor, use default currency code', () => {
        let testItem = new CurrencyLocalizedFormatter(null);
        
        let dtr = testItem.Format(1, CurrencyLookupKey, 'fr-FR');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1,00\xA0$US'); // fr formatting, but US currency symbol
        expect(dtr.ErrorMessage).toBeUndefined();

    });         
    test('With EUR as default currency code, CurrencyLookupKey uses EUR when currencycode is missing in constructor', () => {
        valGlobals.DefaultCurrencyCode = 'EUR';
        let testItem = new CurrencyLocalizedFormatter(null);
        
        let dtr = testItem.Format(1, CurrencyLookupKey, 'fr-FR');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1,00\xA0€');
        expect(dtr.ErrorMessage).toBeUndefined();
        // try english and get its formatting, but still uses the fr currency symbol
        dtr = testItem.Format(1, CurrencyLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('€1.00');
        expect(dtr.ErrorMessage).toBeUndefined();        
    });                    
    test('null and undefined input results in empty string', () => {
        let testItem = new CurrencyLocalizedFormatter();
        
        let dtr = testItem.Format(null, CurrencyLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = testItem.Format(undefined, CurrencyLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
    });    
    test('Invalid type returns ErrorMessage', () => {
        let testItem = new CurrencyLocalizedFormatter();
        
        let dtr = testItem.Format('A', CurrencyLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a number');
        
        dtr = testItem.Format({}, CurrencyLookupKey, 'en');
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a number');
        
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
        
        let dtr = testItem.Format(1, PercentageLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('100%');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = testItem.Format(0.15, PercentageLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('15%');
        dtr = testItem.Format(1000, PercentageLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('100,000%');
        dtr = testItem.Format(-0.09, PercentageLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('-9%');
    });

    test('fr culture with various valid numbers', () => {
        let testItem = new PercentageLocalizedFormatter();
        
        let dtr = testItem.Format(1, PercentageLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('100\xA0%');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = testItem.Format(0.15, PercentageLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('15\xA0%');
        dtr = testItem.Format(1000, PercentageLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('100\u{202F}000\xA0%');
        dtr = testItem.Format(-0.09, PercentageLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('-9\xA0%');
    });    
    test('null and undefined empty string', () => {
        let testItem = new PercentageLocalizedFormatter();
        
        let dtr = testItem.Format(null, PercentageLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = testItem.Format(undefined, PercentageLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
    });
    test('Invalid type returns ErrorMessage', () => {
        let testItem = new PercentageLocalizedFormatter();
        
        let dtr = testItem.Format('A', PercentageLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a number');
        
        dtr = testItem.Format({}, PercentageLookupKey, 'en');
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a number');
        
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
        
        let dtr = testItem.Format(100, Percentage100LookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('100%');
        expect(dtr.ErrorMessage).toBeUndefined();
        // Intl rounds percentage by default.
        dtr = testItem.Format(15.2, Percentage100LookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('15%');
        dtr = testItem.Format(15.5, Percentage100LookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('16%');
        dtr = testItem.Format(1000, Percentage100LookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1,000%');
        dtr = testItem.Format(-9, Percentage100LookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('-9%');
    });

    test('fr culture with various valid numbers', () => {
        let testItem = new Percentage100LocalizedFormatter();
        
        let dtr = testItem.Format(100, Percentage100LookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('100\xA0%');
        expect(dtr.ErrorMessage).toBeUndefined();
        // Intl rounds percentage by default
        dtr = testItem.Format(15.2, Percentage100LookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('15\xA0%');
        dtr = testItem.Format(15.5, Percentage100LookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('16\xA0%');        
        dtr = testItem.Format(1000, Percentage100LookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1\u{202F}000\xA0%');
        dtr = testItem.Format(-9, Percentage100LookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('-9\xA0%');
    });    
    test('null and undefined empty string', () => {
        let testItem = new Percentage100LocalizedFormatter();
        
        let dtr = testItem.Format(null, Percentage100LookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = testItem.Format(undefined, Percentage100LookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
    });
    test('Invalid type returns ErrorMessage', () => {
        let testItem = new Percentage100LocalizedFormatter();
        
        let dtr = testItem.Format('A', Percentage100LookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a number');
        
        dtr = testItem.Format({}, Percentage100LookupKey, 'en');
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a number');
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
        
        let dtr = testItem.Format(true, BooleanLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('true');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = testItem.Format(false, BooleanLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('false');
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
        
        let dtr = testItem.Format(true, BooleanLookupKey, 'en');    // uses global default
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('true');
        expect(dtr.ErrorMessage).toBeUndefined();
        dtr = testItem.Format(false, BooleanLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('false');
        expect(dtr.ErrorMessage).toBeUndefined();

        dtr = testItem.Format(true, BooleanLookupKey, 'en-US');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('USTRUE');
        expect(dtr.ErrorMessage).toBeUndefined();
        dtr = testItem.Format(false, BooleanLookupKey, 'en-US');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('USFALSE');        
        expect(dtr.ErrorMessage).toBeUndefined();       
        
        dtr = testItem.Format(true, BooleanLookupKey, 'en-GB'); // fallback to global default
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('true');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = testItem.Format(false, BooleanLookupKey, 'en-GB');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('false');

        dtr = testItem.Format(true, BooleanLookupKey, 'es'); 
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('esTRUE');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = testItem.Format(false, BooleanLookupKey, 'es');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('esFALSE');        

        dtr = testItem.Format(true, BooleanLookupKey, 'es-SP'); 
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('esSPTRUE');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = testItem.Format(false, BooleanLookupKey, 'es-SP');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('esSPFALSE');    

        dtr = testItem.Format(true, BooleanLookupKey, 'es-MX'); // fallback to es
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('esTRUE');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = testItem.Format(false, BooleanLookupKey, 'es-MX');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('esFALSE');                
    });    
    test('null or undefined returns empty string', () => {
        let testItem = new BooleanLocalizedFormatter();
        
        let dtr = testItem.Format(null, BooleanLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = testItem.Format(undefined, BooleanLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
    });    
    test('Invalid type returns ErrorMessage', () => {
        let testItem = new BooleanLocalizedFormatter();
        
        let dtr = testItem.Format('A', BooleanLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a boolean');
        
        dtr = testItem.Format(1, BooleanLookupKey, 'en');
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a boolean');
        
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
        
        let dtr = testItem.Format(true, YesNoBooleanLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('yes');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = testItem.Format(false, YesNoBooleanLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('no');
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
        
        let dtr = testItem.Format(true, YesNoBooleanLookupKey, 'en');    // uses global default
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('yes');
        expect(dtr.ErrorMessage).toBeUndefined();
        dtr = testItem.Format(false, YesNoBooleanLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('no');
        expect(dtr.ErrorMessage).toBeUndefined();

        dtr = testItem.Format(true, YesNoBooleanLookupKey, 'en-US');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('US YES');
        expect(dtr.ErrorMessage).toBeUndefined();
        dtr = testItem.Format(false, YesNoBooleanLookupKey, 'en-US');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('US NO');        
        expect(dtr.ErrorMessage).toBeUndefined();       
        
        dtr = testItem.Format(true, YesNoBooleanLookupKey, 'en-GB'); // fallback to global default
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('yes');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = testItem.Format(false, YesNoBooleanLookupKey, 'en-GB');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('no');

        dtr = testItem.Format(true, BooleanLookupKey, 'es'); 
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('sí');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = testItem.Format(false, BooleanLookupKey, 'es');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('no');        

        dtr = testItem.Format(true, BooleanLookupKey, 'es-SP'); 
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('esSP sí');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = testItem.Format(false, BooleanLookupKey, 'es-SP');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('esSP no');    

        dtr = testItem.Format(true, BooleanLookupKey, 'es-MX'); // fallback to es
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('sí');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = testItem.Format(false, BooleanLookupKey, 'es-MX');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('no');         
        
        dtr = testItem.Format(true, BooleanLookupKey, 'de'); // fallback to es
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('yes');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = testItem.Format(false, BooleanLookupKey, 'de');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('no');                    
    });    
    test('null or undefined returns empty string', () => {
        let testItem = new YesNoBooleanLocalizedFormatter();
        
        let dtr = testItem.Format(null, YesNoBooleanLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = testItem.Format(undefined, YesNoBooleanLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
    });    
    test('Invalid type returns ErrorMessage', () => {
        let testItem = new YesNoBooleanLocalizedFormatter();
        
        let dtr = testItem.Format('A', YesNoBooleanLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a boolean');
        
        dtr = testItem.Format(1, YesNoBooleanLookupKey, 'en');
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a boolean');
        
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
        let dtr = testItem.Format(date1, DateTimeLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('10/31/2000, 12:00 AM');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dtr = testItem.Format(date2, DateTimeLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1/1/1980, 4:00 AM');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dtr = testItem.Format(date3, DateTimeLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1/15/1980, 4:04 PM');
    });

    test('fr culture with various valid dates', () => {
        let testItem = new DateTimeLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dtr = testItem.Format(date1, DateTimeLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('31/10/2000 00:00');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dtr = testItem.Format(date2, DateTimeLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('01/01/1980 04:00');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dtr = testItem.Format(date3, DateTimeLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('15/01/1980 16:04');
    });    
    test('null or undefined return empty string', () => {
        let testItem = new DateTimeLocalizedFormatter();
        
        let dtr = testItem.Format(null, DateTimeLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = testItem.Format(undefined, DateTimeLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
    });
    test('Calues other than Date, null or undefined are errors', () => {
        let testItem = new DateTimeLocalizedFormatter();
        
        let dtr = testItem.Format({}, DateTimeLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
        
        dtr = testItem.Format('', DateTimeLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
        
        dtr = testItem.Format(10, DateTimeLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
            
        dtr = testItem.Format(true, DateTimeLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
                
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
        let dtr = testItem.Format(date1, DateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('10/31/2000');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dtr = testItem.Format(date2, DateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1/1/1980');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dtr = testItem.Format(date3, DateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1/15/1980');
    });

    test('fr culture with various valid dates', () => {
        let testItem = new DateLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dtr = testItem.Format(date1, DateLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('31/10/2000');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dtr = testItem.Format(date2, DateLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('01/01/1980');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dtr = testItem.Format(date3, DateLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('15/01/1980');
    });    
    test('null or undefined returns empty string', () => {
        let testItem = new DateLocalizedFormatter();
        
        let dtr = testItem.Format(null, DateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = testItem.Format(undefined, DateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
    });
    test('Values other than Date, null or undefined are errors', () => {
        let testItem = new DateLocalizedFormatter();
        
        let dtr = testItem.Format({}, DateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
        
        dtr = testItem.Format('', DateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
        
        dtr = testItem.Format(10, DateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
            
        dtr = testItem.Format(true, DateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
                
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
        let dtr = testItem.Format(date1, AbbrevDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('Oct 31, 2000');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dtr = testItem.Format(date2, AbbrevDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('Jan 1, 1980');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dtr = testItem.Format(date3, AbbrevDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('Jan 15, 1980');
    });

    test('fr culture with various valid dates', () => {
        let testItem = new AbbrevDateLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dtr = testItem.Format(date1, AbbrevDateLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('31 oct. 2000');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dtr = testItem.Format(date2, AbbrevDateLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1 janv. 1980');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dtr = testItem.Format(date3, AbbrevDateLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('15 janv. 1980');
    });    
    test('null or undefined returns empty string', () => {
        let testItem = new AbbrevDateLocalizedFormatter();
        
        let dtr = testItem.Format(null, AbbrevDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = testItem.Format(undefined, AbbrevDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
    });
    test('Values other than Date, null or undefined are errors', () => {
        let testItem = new AbbrevDateLocalizedFormatter();
        
        let dtr = testItem.Format({}, AbbrevDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
        
        dtr = testItem.Format('', AbbrevDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
        
        dtr = testItem.Format(10, AbbrevDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
            
        dtr = testItem.Format(true, AbbrevDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
                
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
        let dtr = testItem.Format(date1, AbbrevDOWDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('Tue, Oct 31, 2000');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 2, 4, 0, 30);
        dtr = testItem.Format(date2, AbbrevDOWDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('Wed, Jan 2, 1980');
        let date3 = new Date(1980, 0, 18, 16, 4, 0);        
        dtr = testItem.Format(date3, AbbrevDOWDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('Fri, Jan 18, 1980');
    });

    test('fr culture with various valid dates', () => {
        let testItem = new AbbrevDOWDateLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dtr = testItem.Format(date1, AbbrevDOWDateLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('mar. 31 oct. 2000');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 3, 4, 0, 30);
        dtr = testItem.Format(date2, AbbrevDOWDateLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('jeu. 3 janv. 1980');
        let date3 = new Date(1980, 0, 18, 16, 4, 0);        
        dtr = testItem.Format(date3, AbbrevDOWDateLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('ven. 18 janv. 1980');
    });    
    test('Null or undefined returns empty string', () => {
        let testItem = new AbbrevDOWDateLocalizedFormatter();
        
        let dtr = testItem.Format(null, AbbrevDOWDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = testItem.Format(undefined, AbbrevDOWDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
    });
    test('Values other than Date, null or undefined are errors', () => {
        let testItem = new AbbrevDOWDateLocalizedFormatter();
        
        let dtr = testItem.Format({}, AbbrevDOWDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
        
        dtr = testItem.Format('', AbbrevDOWDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
        
        dtr = testItem.Format(10, AbbrevDOWDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
            
        dtr = testItem.Format(true, AbbrevDOWDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
                
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
        let dtr = testItem.Format(date1, LongDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('October 31, 2000');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dtr = testItem.Format(date2, LongDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('January 1, 1980');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dtr = testItem.Format(date3, LongDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('January 15, 1980');
    });

    test('fr culture with various valid dates', () => {
        let testItem = new LongDateLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dtr = testItem.Format(date1, LongDateLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('31 octobre 2000');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dtr = testItem.Format(date2, LongDateLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('1 janvier 1980');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dtr = testItem.Format(date3, LongDateLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('15 janvier 1980');
    });    
    test('null or undefined returns empty string', () => {
        let testItem = new LongDateLocalizedFormatter();
        
        let dtr = testItem.Format(null, LongDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = testItem.Format(undefined, LongDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
    });
    test('Values other than Date, null or undefined are errors', () => {
        let testItem = new LongDateLocalizedFormatter();
        
        let dtr = testItem.Format({}, LongDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
        
        dtr = testItem.Format('', LongDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
        
        dtr = testItem.Format(10, LongDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
            
        dtr = testItem.Format(true, LongDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
                
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
        let dtr = testItem.Format(date1, LongDOWDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('Tuesday, October 31, 2000');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 2, 4, 0, 30);
        dtr = testItem.Format(date2, LongDOWDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('Wednesday, January 2, 1980');
        let date3 = new Date(1980, 0, 18, 16, 4, 0);        
        dtr = testItem.Format(date3, LongDOWDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('Friday, January 18, 1980');
    });

    test('fr culture with various valid dates', () => {
        let testItem = new LongDOWDateLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dtr = testItem.Format(date1, LongDOWDateLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('mardi 31 octobre 2000');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 3, 4, 0, 30);
        dtr = testItem.Format(date2, LongDOWDateLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('jeudi 3 janvier 1980');
        let date3 = new Date(1980, 0, 18, 16, 4, 0);        
        dtr = testItem.Format(date3, LongDOWDateLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('vendredi 18 janvier 1980');
    });    
    test('null or undefined returns empty string', () => {
        let testItem = new LongDOWDateLocalizedFormatter();
        
        let dtr = testItem.Format(null, LongDOWDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = testItem.Format(undefined, LongDOWDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
    });
    test('Values other than Date, null or undefined are errors', () => {
        let testItem = new LongDOWDateLocalizedFormatter();
        
        let dtr = testItem.Format({}, LongDOWDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
        
        dtr = testItem.Format('', LongDOWDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
        
        dtr = testItem.Format(10, LongDOWDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
            
        dtr = testItem.Format(true, LongDOWDateLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
                
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
        let dtr = testItem.Format(date1, TimeOfDayLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('12:00 AM');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dtr = testItem.Format(date2, TimeOfDayLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('4:00 AM');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dtr = testItem.Format(date3, TimeOfDayLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('4:04 PM');
    });

    test('fr culture with various valid dates', () => {
        let testItem = new TimeofDayLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dtr = testItem.Format(date1, TimeOfDayLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('00:00');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dtr = testItem.Format(date2, TimeOfDayLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('04:00');
        
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dtr = testItem.Format(date3, TimeOfDayLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('16:04');
    });    
    test('null or undefined returns empty string', () => {
        let testItem = new TimeofDayLocalizedFormatter();
        
        let dtr = testItem.Format(null, TimeOfDayLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = testItem.Format(undefined, TimeOfDayLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
    });
    test('values other than Date, null or undefined are errors', () => {
        let testItem = new TimeofDayLocalizedFormatter();
        
        let dtr = testItem.Format({}, TimeOfDayLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
        
        dtr = testItem.Format('', TimeOfDayLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
        
        dtr = testItem.Format(10, TimeOfDayLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
            
        dtr = testItem.Format(true, TimeOfDayLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
                
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
        let dtr = testItem.Format(date1, TimeOfDayHMSLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('00:00:00');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dtr = testItem.Format(date2, TimeOfDayHMSLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('04:00:30');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dtr = testItem.Format(date3, TimeOfDayHMSLookupKey, 'fr');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('16:04:00');
    });    
    test('null or undefined returns empty string', () => {
        let testItem = new TimeofDayHMSLocalizedFormatter();
        
        let dtr = testItem.Format(null, TimeOfDayHMSLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
        dtr = testItem.Format(undefined, TimeOfDayHMSLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBe('');
        expect(dtr.ErrorMessage).toBeUndefined();
        
    });
    test('Values other than Date, null or undefined are errors', () => {
        let testItem = new TimeofDayHMSLocalizedFormatter();
        
        let dtr = testItem.Format({}, TimeOfDayHMSLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
        
        dtr = testItem.Format('', TimeOfDayHMSLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
        
        dtr = testItem.Format(10, TimeOfDayHMSLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
            
        dtr = testItem.Format(true, TimeOfDayHMSLookupKey, 'en');
        expect(dtr).not.toBeNull();
        expect(dtr.Value).toBeUndefined();
        expect(dtr.ErrorMessage).toBe('Not a date');
                
    });        
});