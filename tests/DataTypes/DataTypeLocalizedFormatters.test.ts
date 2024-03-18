import {
    AbbrevDOWDateLocalizedFormatter, AbbrevDateLocalizedFormatter, BooleanLocalizedFormatter, CapitalizeStringLocalizedFormatter, CurrencyLocalizedFormatter,
    DataTypeLocalizedFormatterBase, DateLocalizedFormatter, DateTimeLocalizedFormatter, LongDOWDateLocalizedFormatter, LongDateLocalizedFormatter,
    LowercaseStringLocalizedFormatter, NumberLocalizedFormatter, Percentage100LocalizedFormatter, PercentageLocalizedFormatter, StringLocalizedFormatter,
    TimeofDayHMSLocalizedFormatter, TimeofDayLocalizedFormatter, UppercaseStringLocalizedFormatter
} from './../../src/DataTypes/DataTypeLocalizedFormatters';

import { IDataTypeResolution } from '../../src/Interfaces/DataTypes';
import { MockValidationServices } from '../Mocks';
import { TextLocalizerService } from '../../src/Services/TextLocalizerService';
import { LookupKey } from '../../src/DataTypes/LookupKeys';

describe('DataTypeLocalizedFormatterBase', () => {
    class TestClass extends DataTypeLocalizedFormatterBase
    {
        protected get ExpectedLookupKeys(): string {
            throw new Error('Method not implemented.');
        }
        protected SupportsCulture(cultureId: string): boolean {
            throw new Error('Method not implemented.');
        }
        public Format(value: any, dataTypeLookupKey: string, cultureId: string): IDataTypeResolution<string> {
            throw new Error('Method not implemented.');
        }
        
    }
    test('Services that are unassigned throw', () => {
        let testItem = new TestClass();
        let x: any;
        expect(() => x = testItem.Services).toThrow(/Register/);
    });
    test('Services to return same ValidationService as assigned', () => {
        let services = new MockValidationServices(false, false);
        let testItem = new TestClass();
        expect(() => testItem.Services = services).not.toThrow();
        expect(testItem.Services).toBe(services);
    });
})

describe('StringLocalizedFormatter', () => {

    test('Supports', () => {
        let testItem = new StringLocalizedFormatter();
        expect(testItem.Supports(LookupKey.String, 'en')).toBe(true);
        expect(testItem.Supports(LookupKey.String, 'fr')).toBe(true);    
        expect(testItem.Supports(LookupKey.Number, 'en')).toBe(false);   
        expect(testItem.Supports(LookupKey.Uppercase, 'en')).toBe(false);        
    });
    test('en: Format with string parameter', () => {
        let testItem = new StringLocalizedFormatter();
        let dts = testItem.Format('A', LookupKey.String, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('A');
        expect(dts.ErrorMessage).toBeUndefined();
    });

    test('fr: Format with string parameter', () => {
        let testItem = new StringLocalizedFormatter();
        let dts = testItem.Format('A', LookupKey.String, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('A');
        expect(dts.ErrorMessage).toBeUndefined();
    });    
    test('Format with number parameter is converted to string', () => {
        let testItem = new StringLocalizedFormatter();
        
        let dts = testItem.Format(15, LookupKey.String, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('15');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Format with null parameter returns empty string', () => {
        let testItem = new StringLocalizedFormatter();
        
        let dts = testItem.Format(null, LookupKey.String, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Format with undefined parameter returns empty string', () => {
        let testItem = new StringLocalizedFormatter();
        
        let dts = testItem.Format(undefined, LookupKey.String, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Format with object parameter is an error', () => {
        let testItem = new StringLocalizedFormatter();
        
        let dts = testItem.Format({}, LookupKey.String, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a string or primitive');
    });
});
describe('CapitalizeStringLocalizedFormatter', () => {

    test('Supports', () => {
        let testItem = new CapitalizeStringLocalizedFormatter();
        expect(testItem.Supports(LookupKey.Capitalize, 'en')).toBe(true);
        expect(testItem.Supports(LookupKey.Capitalize, 'fr')).toBe(true);    
        expect(testItem.Supports(LookupKey.Number, 'en')).toBe(false);   
        expect(testItem.Supports('anythingelse', 'en')).toBe(false);        
    });
    test('en: Format with string parameter', () => {
        let testItem = new CapitalizeStringLocalizedFormatter();
        let dts = testItem.Format('A', LookupKey.Capitalize, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('A');
        expect(dts.ErrorMessage).toBeUndefined();

        dts = testItem.Format('a', LookupKey.Capitalize, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('A');
        dts = testItem.Format('abc', LookupKey.Capitalize, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('Abc');        
        dts = testItem.Format('', LookupKey.Capitalize, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');               
    });

    test('fr: Format with string parameter', () => {
        let testItem = new CapitalizeStringLocalizedFormatter();
        let dts = testItem.Format('A', LookupKey.Capitalize, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('A');
        expect(dts.ErrorMessage).toBeUndefined();
        dts = testItem.Format('a', LookupKey.Capitalize, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('A');
        dts = testItem.Format('abc', LookupKey.Capitalize, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('Abc');        
        dts = testItem.Format('', LookupKey.Capitalize, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
    });    
    test('Format with number parameter is converted to string', () => {
        let testItem = new CapitalizeStringLocalizedFormatter();
        
        let dts = testItem.Format(15, LookupKey.Capitalize, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('15');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Format with null parameter returns empty string', () => {
        let testItem = new CapitalizeStringLocalizedFormatter();
        
        let dts = testItem.Format(null, LookupKey.Capitalize, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Format with undefined parameter returns empty string', () => {
        let testItem = new CapitalizeStringLocalizedFormatter();
        
        let dts = testItem.Format(undefined, LookupKey.Capitalize, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Format with object parameter is an error', () => {
        let testItem = new CapitalizeStringLocalizedFormatter();
        
        let dts = testItem.Format({}, LookupKey.Capitalize, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a string or primitive');
    });
});
describe('UppercaseStringLocalizedFormatter', () => {

    test('Supports', () => {
        let testItem = new UppercaseStringLocalizedFormatter();
        expect(testItem.Supports(LookupKey.Uppercase, 'en')).toBe(true);
        expect(testItem.Supports(LookupKey.Uppercase, 'fr')).toBe(true);    
        expect(testItem.Supports(LookupKey.Number, 'en')).toBe(false);   
        expect(testItem.Supports('anythingelse', 'en')).toBe(false);        
    });
    test('en: Format with string parameter', () => {
        let testItem = new UppercaseStringLocalizedFormatter();
        let dts = testItem.Format('A', LookupKey.Uppercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('A');
        expect(dts.ErrorMessage).toBeUndefined();

        dts = testItem.Format('a', LookupKey.Uppercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('A');
        dts = testItem.Format('ABC', LookupKey.Uppercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('ABC');           
        dts = testItem.Format('abc', LookupKey.Uppercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('ABC');        
        dts = testItem.Format('', LookupKey.Uppercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');               
    });

    test('fr: Format with string parameter', () => {
        let testItem = new UppercaseStringLocalizedFormatter();
        let dts = testItem.Format('A', LookupKey.Uppercase, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('A');
        expect(dts.ErrorMessage).toBeUndefined();
        dts = testItem.Format('a', LookupKey.Uppercase, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('A');
        dts = testItem.Format('ABC', LookupKey.Uppercase, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('ABC');          
        dts = testItem.Format('abc', LookupKey.Uppercase, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('ABC');        
        dts = testItem.Format('', LookupKey.Uppercase, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
    });    
    test('Format with number parameter is converted to string', () => {
        let testItem = new UppercaseStringLocalizedFormatter();
        
        let dts = testItem.Format(15, LookupKey.Uppercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('15');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Format with null parameter returns empty string', () => {
        let testItem = new UppercaseStringLocalizedFormatter();
        
        let dts = testItem.Format(null, LookupKey.Uppercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Format with undefined parameter returns empty string', () => {
        let testItem = new UppercaseStringLocalizedFormatter();
        
        let dts = testItem.Format(undefined, LookupKey.Uppercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Format with object parameter is an error', () => {
        let testItem = new UppercaseStringLocalizedFormatter();
        
        let dts = testItem.Format({}, LookupKey.Uppercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a string or primitive');
    });
});
describe('LowercaseStringLocalizedFormatter', () => {

    test('Supports', () => {
        let testItem = new LowercaseStringLocalizedFormatter();
        expect(testItem.Supports(LookupKey.Lowercase, 'en')).toBe(true);
        expect(testItem.Supports(LookupKey.Lowercase, 'fr')).toBe(true);    
        expect(testItem.Supports(LookupKey.Number, 'en')).toBe(false);   
        expect(testItem.Supports('anythingelse', 'en')).toBe(false);        
    });
    test('en: Format with string parameter', () => {
        let testItem = new LowercaseStringLocalizedFormatter();
        let dts = testItem.Format('A', LookupKey.Lowercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('a');
        expect(dts.ErrorMessage).toBeUndefined();

        dts = testItem.Format('a', LookupKey.Lowercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('a');
        dts = testItem.Format('ABC', LookupKey.Lowercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('abc');           
        dts = testItem.Format('abc', LookupKey.Lowercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('abc');        
        dts = testItem.Format('', LookupKey.Lowercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');               
    });

    test('fr: Format with string parameter', () => {
        let testItem = new LowercaseStringLocalizedFormatter();
        let dts = testItem.Format('A', LookupKey.Lowercase, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('a');
        expect(dts.ErrorMessage).toBeUndefined();
        dts = testItem.Format('a', LookupKey.Lowercase, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('a');
        dts = testItem.Format('ABC', LookupKey.Lowercase, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('abc');          
        dts = testItem.Format('abc', LookupKey.Lowercase, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('abc');        
        dts = testItem.Format('', LookupKey.Lowercase, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
    });    
    test('Format with number parameter is converted to string', () => {
        let testItem = new LowercaseStringLocalizedFormatter();
        
        let dts = testItem.Format(15, LookupKey.Lowercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('15');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Format with null parameter returns empty string', () => {
        let testItem = new LowercaseStringLocalizedFormatter();
        
        let dts = testItem.Format(null, LookupKey.Lowercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Format with undefined parameter returns empty string', () => {
        let testItem = new LowercaseStringLocalizedFormatter();
        
        let dts = testItem.Format(undefined, LookupKey.Lowercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Format with object parameter is an error', () => {
        let testItem = new LowercaseStringLocalizedFormatter();
        
        let dts = testItem.Format({}, LookupKey.Lowercase, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a string or primitive');
    });
});

describe('NumberLocalizedFormatter', () => {
    test('en: Supports LookupKey.Number is true, others false', () => {
        let testItem = new NumberLocalizedFormatter();
        
        expect(testItem.Supports(LookupKey.Number, 'en')).toBe(true);       
        expect(testItem.Supports('anythingelse', 'en')).toBe(false);              
    });
    test('Supports LookupKey.Number is true no matter the culture', () => {
        let testItem = new NumberLocalizedFormatter();
        
        expect(testItem.Supports(LookupKey.Number, 'fr')).toBe(true);        
        expect(testItem.Supports('anythingelse', 'fr')).toBe(false);
    });
    test('en culture with various valid numbers', () => {
        let testItem = new NumberLocalizedFormatter();
        
        let dts = testItem.Format(1, LookupKey.Number, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(1.5, LookupKey.Number, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1.5');
        dts = testItem.Format(1000000, LookupKey.Number, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1,000,000');
        dts = testItem.Format(-9.50101, LookupKey.Number, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('-9.501');
    });

    test('fr culture with various valid numbers', () => {
        let testItem = new NumberLocalizedFormatter();
        

        let dts = testItem.Format(1, LookupKey.Number, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(1.5, LookupKey.Number, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1,5');
        dts = testItem.Format(1000000, LookupKey.Number, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1\u{202F}000\u{202F}000');
        dts = testItem.Format(-9.50101, LookupKey.Number, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('-9,501');
    });    
    test('en culture with ways to output empty string', () => {
        let testItem = new NumberLocalizedFormatter();
        

        let dts = testItem.Format(null, LookupKey.Number, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(undefined, LookupKey.Number, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
    });
    test('Invalid type returns ErrorMessage', () => {
        let testItem = new NumberLocalizedFormatter();
        

        let dts = testItem.Format('A', LookupKey.Number, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a number');
        
        dts = testItem.Format({}, LookupKey.Number, 'en');
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a number');
        
    });
});
describe('CurrencyLocalizedFormatter', () => {
    test('en: Supports LookupKey.Currency is true. All others are false', () => {
        let testItem = new CurrencyLocalizedFormatter('USD');
        
        expect(testItem.Supports(LookupKey.Currency, 'en')).toBe(true);       
        expect(testItem.Supports('anythingelse', 'en')).toBe(false);             
    });
    test('Supports LookupKey.Currency is true in all cultures', () => {
        let testItem = new CurrencyLocalizedFormatter('USD');
        
        expect(testItem.Supports(LookupKey.Currency, 'fr')).toBe(true);        
        expect(testItem.Supports('anythingelse', 'fr')).toBe(false);
    });

    test('en culture with various valid numbers, using currencycode USD from global default', () => {
        let testItem = new CurrencyLocalizedFormatter('USD');
        
        let dts = testItem.Format(1, LookupKey.Currency, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('$1.00');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(1.5, LookupKey.Currency, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('$1.50');
        dts = testItem.Format(1000000, LookupKey.Currency, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('$1,000,000.00');
        dts = testItem.Format(-9.50101, LookupKey.Currency, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('-$9.50');
    });

    test('fr culture with various valid numbers', () => {
        let testItem = new CurrencyLocalizedFormatter('USD', null,
            {
                'fr': 'EUR',
            });
        
        let dts = testItem.Format(1, LookupKey.Currency, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1,00\xA0€');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(1.5, LookupKey.Currency, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1,50\xA0€');
        dts = testItem.Format(1000000, LookupKey.Currency, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1\u{202F}000\u{202F}000,00\xA0€');
        dts = testItem.Format(-9.50101, LookupKey.Currency, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('-9,50\xA0€');
    });    
    test('fr-FR culture with various valid numbers', () => {
        let testItem = new CurrencyLocalizedFormatter('USD', null,
            {
                'fr-FR': 'EUR',
            });
        
        let dts = testItem.Format(1, LookupKey.Currency, 'fr-FR');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1,00\xA0€');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(1.5, LookupKey.Currency, 'fr-FR');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1,50\xA0€');
        dts = testItem.Format(1000000, LookupKey.Currency, 'fr-FR');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1\u{202F}000\u{202F}000,00\xA0€');
        dts = testItem.Format(-9.50101, LookupKey.Currency, 'fr-FR');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('-9,50\xA0€');
    });        
    test('When full culture is missing in constructor, fallback to countrycode culture', () => {
        let testItem = new CurrencyLocalizedFormatter('EUR', null,
            {
                'fr': 'EUR',
            });
        
        let dts = testItem.Format(1, LookupKey.Currency, 'fr-FR');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1,00\xA0€');
        expect(dts.ErrorMessage).toBeUndefined();
    });       
    test('With global default currency code of USD and currencycode is missing in constructor, use default currency code', () => {
        let testItem = new CurrencyLocalizedFormatter('USD', null);
        
        let dts = testItem.Format(1, LookupKey.Currency, 'fr-FR');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1,00\xA0$US'); // fr formatting, but US currency symbol
        expect(dts.ErrorMessage).toBeUndefined();

    });         
    test('With EUR as default currency code, LookupKey.Currency uses EUR when currencycode is missing in constructor', () => {
        let testItem = new CurrencyLocalizedFormatter('EUR', null);
        
        let dts = testItem.Format(1, LookupKey.Currency, 'fr-FR');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1,00\xA0€');
        expect(dts.ErrorMessage).toBeUndefined();
        // try english and get its formatting, but still uses the fr currency symbol
        dts = testItem.Format(1, LookupKey.Currency, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('€1.00');
        expect(dts.ErrorMessage).toBeUndefined();        
    });                    
    test('null and undefined input results in empty string', () => {
        let testItem = new CurrencyLocalizedFormatter('USD');
        
        let dts = testItem.Format(null, LookupKey.Currency, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(undefined, LookupKey.Currency, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
    });    
    test('Invalid type returns ErrorMessage', () => {
        let testItem = new CurrencyLocalizedFormatter('USD');
        
        let dts = testItem.Format('A', LookupKey.Currency, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a number');
        
        dts = testItem.Format({}, LookupKey.Currency, 'en');
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a number');
        
    });    
});
describe('PercentageLocalizedFormatter', () => {
    test('en: Supports LookupKey.Percentage is true. All others false', () => {
        let testItem = new PercentageLocalizedFormatter();
        
        expect(testItem.Supports(LookupKey.Percentage, 'en')).toBe(true);        
        expect(testItem.Supports('anythingelse', 'en')).toBe(false);
    });
    test('all cultures: Supports LookupKey.Percentage is true. All others false', () => {
        let testItem = new PercentageLocalizedFormatter();
        
        expect(testItem.Supports(LookupKey.Percentage, 'fr')).toBe(true);        
        expect(testItem.Supports('anythingelse', 'fr')).toBe(false);
    });

    test('en culture with various valid numbers', () => {
        let testItem = new PercentageLocalizedFormatter();
        
        let dts = testItem.Format(1, LookupKey.Percentage, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('100%');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(0.15, LookupKey.Percentage, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('15%');
        dts = testItem.Format(1000, LookupKey.Percentage, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('100,000%');
        dts = testItem.Format(-0.09, LookupKey.Percentage, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('-9%');
    });

    test('fr culture with various valid numbers', () => {
        let testItem = new PercentageLocalizedFormatter();
        
        let dts = testItem.Format(1, LookupKey.Percentage, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('100\xA0%');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(0.15, LookupKey.Percentage, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('15\xA0%');
        dts = testItem.Format(1000, LookupKey.Percentage, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('100\u{202F}000\xA0%');
        dts = testItem.Format(-0.09, LookupKey.Percentage, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('-9\xA0%');
    });    
    test('null and undefined empty string', () => {
        let testItem = new PercentageLocalizedFormatter();
        
        let dts = testItem.Format(null, LookupKey.Percentage, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(undefined, LookupKey.Percentage, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
    });
    test('Invalid type returns ErrorMessage', () => {
        let testItem = new PercentageLocalizedFormatter();
        
        let dts = testItem.Format('A', LookupKey.Percentage, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a number');
        
        dts = testItem.Format({}, LookupKey.Percentage, 'en');
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a number');
        
    });
});


describe('Percentage100LocalizedFormatter', () => {
    test('en: Supports LookupKey.Percentage100 is true. All others false', () => {
        let testItem = new Percentage100LocalizedFormatter();
        
        expect(testItem.Supports(LookupKey.Percentage100, 'en')).toBe(true);        
        expect(testItem.Supports('anythingelse', 'en')).toBe(false);
    });
    test('all cultures: Supports LookupKey.Percentage100 is true. All others false', () => {
        let testItem = new Percentage100LocalizedFormatter();
        
        expect(testItem.Supports(LookupKey.Percentage100, 'fr')).toBe(true);        
        expect(testItem.Supports('anythingelse', 'fr')).toBe(false);
    });

    test('en culture with various valid numbers', () => {
        let testItem = new Percentage100LocalizedFormatter();
        
        let dts = testItem.Format(100, LookupKey.Percentage100, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('100%');
        expect(dts.ErrorMessage).toBeUndefined();
        // Intl rounds percentage by default.
        dts = testItem.Format(15.2, LookupKey.Percentage100, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('15%');
        dts = testItem.Format(15.5, LookupKey.Percentage100, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('16%');
        dts = testItem.Format(1000, LookupKey.Percentage100, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1,000%');
        dts = testItem.Format(-9, LookupKey.Percentage100, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('-9%');
    });

    test('fr culture with various valid numbers', () => {
        let testItem = new Percentage100LocalizedFormatter();
        
        let dts = testItem.Format(100, LookupKey.Percentage100, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('100\xA0%');
        expect(dts.ErrorMessage).toBeUndefined();
        // Intl rounds percentage by default
        dts = testItem.Format(15.2, LookupKey.Percentage100, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('15\xA0%');
        dts = testItem.Format(15.5, LookupKey.Percentage100, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('16\xA0%');        
        dts = testItem.Format(1000, LookupKey.Percentage100, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1\u{202F}000\xA0%');
        dts = testItem.Format(-9, LookupKey.Percentage100, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('-9\xA0%');
    });    
    test('null and undefined empty string', () => {
        let testItem = new Percentage100LocalizedFormatter();
        
        let dts = testItem.Format(null, LookupKey.Percentage100, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(undefined, LookupKey.Percentage100, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
    });
    test('Invalid type returns ErrorMessage', () => {
        let testItem = new Percentage100LocalizedFormatter();
        
        let dts = testItem.Format('A', LookupKey.Percentage100, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a number');
        
        dts = testItem.Format({}, LookupKey.Percentage100, 'en');
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a number');
    });
});

describe('BooleanLocalizedFormatter', () => {
    test('en culture supports LookupKey.Boolean is true. All others are false', () => {
        let testItem = new BooleanLocalizedFormatter(LookupKey.Boolean);
        
        expect(testItem.Supports(LookupKey.Boolean, 'en')).toBe(true);        
        expect(testItem.Supports('anylookupkey', 'en')).toBe(false);
    });
    test('any culture supports LookupKey.Boolean is true. All others are false', () => {
        let testItem = new BooleanLocalizedFormatter(LookupKey.Boolean);
        
        expect(testItem.Supports(LookupKey.Boolean, 'fr')).toBe(true);        
        expect(testItem.Supports('anylookupkey', 'fr')).toBe(false);
    });

    test('Without TextLocalizationService, true and false are "true" and "false"', () => {
        let testItem = new BooleanLocalizedFormatter(LookupKey.Boolean);
        
        let dts = testItem.Format(true, LookupKey.Boolean, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('true');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(false, LookupKey.Boolean, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('false');
    });
    test('Without TextLocalizationService, true and false are values supplied in the constructor', () => {
        let testItem = new BooleanLocalizedFormatter(LookupKey.Boolean, "T", "F");
        
        let dts = testItem.Format(true, LookupKey.Boolean, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('T');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(false, LookupKey.Boolean, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('F');
    });    
    test('TextLocalizationService used for labels unless the culture is not setup', () => {
        let services = new MockValidationServices(false, false);
        let tlService = services.TextLocalizerService as TextLocalizerService;
        tlService.Register('TRUE', {
            'en': 'enTRUE',
            'es': 'esTRUE'
        });
        tlService.Register('FALSE', {
            'en': 'enFALSE',
            'es': 'esFALSE'
        });        
        let testItem = new BooleanLocalizedFormatter(LookupKey.Boolean, 'true', 'false', 'TRUE', 'FALSE');
        testItem.Services = services;
        
        let dts = testItem.Format(true, LookupKey.Boolean, 'en');    // uses global default
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('enTRUE');
        expect(dts.ErrorMessage).toBeUndefined();
        dts = testItem.Format(false, LookupKey.Boolean, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('enFALSE');
        expect(dts.ErrorMessage).toBeUndefined();

        dts = testItem.Format(true, LookupKey.Boolean, 'en-US');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('enTRUE');
        expect(dts.ErrorMessage).toBeUndefined();
        dts = testItem.Format(false, LookupKey.Boolean, 'en-US');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('enFALSE');        
        expect(dts.ErrorMessage).toBeUndefined();       
        
        dts = testItem.Format(true, LookupKey.Boolean, 'en-GB'); // fallback to global default
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('enTRUE');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(false, LookupKey.Boolean, 'en-GB');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('enFALSE');

        dts = testItem.Format(true, LookupKey.Boolean, 'es'); 
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('esTRUE');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(false, LookupKey.Boolean, 'es');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('esFALSE');        

        dts = testItem.Format(true, LookupKey.Boolean, 'es-SP'); 
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('esTRUE');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(false, LookupKey.Boolean, 'es-SP');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('esFALSE');    

        dts = testItem.Format(true, LookupKey.Boolean, 'fr'); // fallback to defaults
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('true');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(false, LookupKey.Boolean, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('false');                
    });    
    test('null or undefined returns empty string', () => {
        let testItem = new BooleanLocalizedFormatter(LookupKey.Boolean);
        
        let dts = testItem.Format(null, LookupKey.Boolean, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(undefined, LookupKey.Boolean, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
    });    
    test('Invalid type returns ErrorMessage', () => {
        let testItem = new BooleanLocalizedFormatter(LookupKey.Boolean);
        
        let dts = testItem.Format('A', LookupKey.Boolean, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a boolean');
        
        dts = testItem.Format(1, LookupKey.Boolean, 'en');
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a boolean');
        
    });
});
describe('DateTimeLocalizedFormatter', () => {
    test('en: Supports LookupKey.DateTime is true. Others are false', () => {
        let testItem = new DateTimeLocalizedFormatter();
        
        expect(testItem.Supports(LookupKey.DateTime, 'en')).toBe(true);        
        expect(testItem.Supports('anythingelse', 'en')).toBe(false);
    });
    test('any culture: Supports LookupKey.DateTime is true. Others are false', () => {
        let testItem = new DateTimeLocalizedFormatter();
        
        expect(testItem.Supports(LookupKey.DateTime, 'fr')).toBe(true);        
        expect(testItem.Supports('otherlookupkeys', 'fr')).toBe(false);
    });

    test('en culture with various valid dates', () => {
        let testItem = new DateTimeLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.Format(date1, LookupKey.DateTime, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('10/31/2000, 12:00 AM');
        expect(dts.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dts = testItem.Format(date2, LookupKey.DateTime, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1/1/1980, 4:00 AM');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dts = testItem.Format(date3, LookupKey.DateTime, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1/15/1980, 4:04 PM');
    });

    test('fr culture with various valid dates', () => {
        let testItem = new DateTimeLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.Format(date1, LookupKey.DateTime, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('31/10/2000 00:00');
        expect(dts.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dts = testItem.Format(date2, LookupKey.DateTime, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('01/01/1980 04:00');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dts = testItem.Format(date3, LookupKey.DateTime, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('15/01/1980 16:04');
    });    
    test('null or undefined return empty string', () => {
        let testItem = new DateTimeLocalizedFormatter();
        
        let dts = testItem.Format(null, LookupKey.DateTime, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(undefined, LookupKey.DateTime, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Calues other than Date, null or undefined are errors', () => {
        let testItem = new DateTimeLocalizedFormatter();
        
        let dts = testItem.Format({}, LookupKey.DateTime, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
        
        dts = testItem.Format('', LookupKey.DateTime, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
        
        dts = testItem.Format(10, LookupKey.DateTime, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
            
        dts = testItem.Format(true, LookupKey.DateTime, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
                
    });
});
describe('DateLocalizedFormatter', () => {
    test('en: Supports LookupKey.Date is true. Others are false', () => {
        let testItem = new DateLocalizedFormatter();
        
        expect(testItem.Supports(LookupKey.Date, 'en')).toBe(true);        
        expect(testItem.Supports('otherlookupkey', 'en')).toBe(false);
    });
    test('all cultures: Supports LookupKey.Date is true. Others are false', () => {
        let testItem = new DateLocalizedFormatter();
        
        expect(testItem.Supports(LookupKey.Date, 'fr')).toBe(true);        
        expect(testItem.Supports('otherlookupkey', 'fr')).toBe(false);
    });

    test('en culture with various valid dates', () => {
        let testItem = new DateLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.Format(date1, LookupKey.Date, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('10/31/2000');
        expect(dts.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dts = testItem.Format(date2, LookupKey.Date, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1/1/1980');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dts = testItem.Format(date3, LookupKey.Date, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1/15/1980');
    });

    test('fr culture with various valid dates', () => {
        let testItem = new DateLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.Format(date1, LookupKey.Date, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('31/10/2000');
        expect(dts.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dts = testItem.Format(date2, LookupKey.Date, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('01/01/1980');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dts = testItem.Format(date3, LookupKey.Date, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('15/01/1980');
    });    
    test('null or undefined returns empty string', () => {
        let testItem = new DateLocalizedFormatter();
        
        let dts = testItem.Format(null, LookupKey.Date, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(undefined, LookupKey.Date, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Values other than Date, null or undefined are errors', () => {
        let testItem = new DateLocalizedFormatter();
        
        let dts = testItem.Format({}, LookupKey.Date, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
        
        dts = testItem.Format('', LookupKey.Date, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
        
        dts = testItem.Format(10, LookupKey.Date, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
            
        dts = testItem.Format(true, LookupKey.Date, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
                
    });

});
describe('AbbrevDateLocalizedFormatter', () => {
    test('en: Supports LookupKey.AbbrevDate is true. Others are false', () => {
        let testItem = new AbbrevDateLocalizedFormatter();
        
        expect(testItem.Supports(LookupKey.AbbrevDate, 'en')).toBe(true);        
        expect(testItem.Supports('otherlookupkey', 'en')).toBe(false);        
    });
    test('fr: Supports LookupKey.AbbrevDate is true. Others are false', () => {
        let testItem = new AbbrevDateLocalizedFormatter();
        
        expect(testItem.Supports(LookupKey.AbbrevDate, 'fr')).toBe(true);        
        expect(testItem.Supports('otherlookupkey', 'fr')).toBe(false);        
    });
    test('en culture with various valid dates', () => {
        let testItem = new AbbrevDateLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.Format(date1, LookupKey.AbbrevDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('Oct 31, 2000');
        expect(dts.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dts = testItem.Format(date2, LookupKey.AbbrevDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('Jan 1, 1980');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dts = testItem.Format(date3, LookupKey.AbbrevDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('Jan 15, 1980');
    });

    test('fr culture with various valid dates', () => {
        let testItem = new AbbrevDateLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.Format(date1, LookupKey.AbbrevDate, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('31 oct. 2000');
        expect(dts.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dts = testItem.Format(date2, LookupKey.AbbrevDate, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1 janv. 1980');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dts = testItem.Format(date3, LookupKey.AbbrevDate, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('15 janv. 1980');
    });    
    test('null or undefined returns empty string', () => {
        let testItem = new AbbrevDateLocalizedFormatter();
        
        let dts = testItem.Format(null, LookupKey.AbbrevDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(undefined, LookupKey.AbbrevDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Values other than Date, null or undefined are errors', () => {
        let testItem = new AbbrevDateLocalizedFormatter();
        
        let dts = testItem.Format({}, LookupKey.AbbrevDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
        
        dts = testItem.Format('', LookupKey.AbbrevDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
        
        dts = testItem.Format(10, LookupKey.AbbrevDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
            
        dts = testItem.Format(true, LookupKey.AbbrevDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
                
    });
});
describe('AbbrevDOWDateLocalizedFormatter', () => {
    test('en: Supports LookupKey.AbbrevDOWDate is true. Others are false', () => {
        let testItem = new AbbrevDOWDateLocalizedFormatter();
        
        expect(testItem.Supports(LookupKey.AbbrevDOWDate, 'en')).toBe(true);        
        expect(testItem.Supports('otherlookupkey', 'en')).toBe(false);
    });
    test('all cultures: Supports LookupKey.AbbrevDOWDate is true. Others are false', () => {
        let testItem = new AbbrevDOWDateLocalizedFormatter();
        
        expect(testItem.Supports(LookupKey.AbbrevDOWDate, 'fr')).toBe(true);        
        expect(testItem.Supports('otherlookupkey', 'fr')).toBe(false);        
    });

    test('en culture with various valid dates', () => {
        let testItem = new AbbrevDOWDateLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.Format(date1, LookupKey.AbbrevDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('Tue, Oct 31, 2000');
        expect(dts.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 2, 4, 0, 30);
        dts = testItem.Format(date2, LookupKey.AbbrevDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('Wed, Jan 2, 1980');
        let date3 = new Date(1980, 0, 18, 16, 4, 0);        
        dts = testItem.Format(date3, LookupKey.AbbrevDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('Fri, Jan 18, 1980');
    });

    test('fr culture with various valid dates', () => {
        let testItem = new AbbrevDOWDateLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.Format(date1, LookupKey.AbbrevDOWDate, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('mar. 31 oct. 2000');
        expect(dts.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 3, 4, 0, 30);
        dts = testItem.Format(date2, LookupKey.AbbrevDOWDate, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('jeu. 3 janv. 1980');
        let date3 = new Date(1980, 0, 18, 16, 4, 0);        
        dts = testItem.Format(date3, LookupKey.AbbrevDOWDate, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('ven. 18 janv. 1980');
    });    
    test('Null or undefined returns empty string', () => {
        let testItem = new AbbrevDOWDateLocalizedFormatter();
        
        let dts = testItem.Format(null, LookupKey.AbbrevDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(undefined, LookupKey.AbbrevDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Values other than Date, null or undefined are errors', () => {
        let testItem = new AbbrevDOWDateLocalizedFormatter();
        
        let dts = testItem.Format({}, LookupKey.AbbrevDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
        
        dts = testItem.Format('', LookupKey.AbbrevDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
        
        dts = testItem.Format(10, LookupKey.AbbrevDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
            
        dts = testItem.Format(true, LookupKey.AbbrevDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
                
    });    
});
describe('LongDateLocalizedFormatter', () => {
    test('en: Supports LookupKey.LongDate is true. Others are false', () => {
        let testItem = new LongDateLocalizedFormatter();
        
        expect(testItem.Supports(LookupKey.LongDate, 'en')).toBe(true);        
        expect(testItem.Supports('otherlookupkey', 'en')).toBe(false);        
    });
    test('fr: Supports LookupKey.LongDate is true. Others are false', () => {
        let testItem = new LongDateLocalizedFormatter();
        
        expect(testItem.Supports(LookupKey.LongDate, 'fr')).toBe(true);        
        expect(testItem.Supports('otherlookupkey', 'fr')).toBe(false);        
    });
    test('en culture with various valid dates', () => {
        let testItem = new LongDateLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.Format(date1, LookupKey.LongDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('October 31, 2000');
        expect(dts.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dts = testItem.Format(date2, LookupKey.LongDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('January 1, 1980');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dts = testItem.Format(date3, LookupKey.LongDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('January 15, 1980');
    });

    test('fr culture with various valid dates', () => {
        let testItem = new LongDateLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.Format(date1, LookupKey.LongDate, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('31 octobre 2000');
        expect(dts.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dts = testItem.Format(date2, LookupKey.LongDate, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('1 janvier 1980');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dts = testItem.Format(date3, LookupKey.LongDate, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('15 janvier 1980');
    });    
    test('null or undefined returns empty string', () => {
        let testItem = new LongDateLocalizedFormatter();
        
        let dts = testItem.Format(null, LookupKey.LongDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(undefined, LookupKey.LongDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Values other than Date, null or undefined are errors', () => {
        let testItem = new LongDateLocalizedFormatter();
        
        let dts = testItem.Format({}, LookupKey.LongDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
        
        dts = testItem.Format('', LookupKey.LongDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
        
        dts = testItem.Format(10, LookupKey.LongDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
            
        dts = testItem.Format(true, LookupKey.LongDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
                
    });
});
describe('LongDOWDateLocalizedFormatter', () => {
    test('en: Supports LookupKey.LongDOWDate is true. Others are false', () => {
        let testItem = new LongDOWDateLocalizedFormatter();
        
        expect(testItem.Supports(LookupKey.LongDOWDate, 'en')).toBe(true);        
        expect(testItem.Supports('otherlookupkey', 'en')).toBe(false);        
    });
    test('fr: Supports LookupKey.LongDOWDate is true. Others are false', () => {
        let testItem = new LongDOWDateLocalizedFormatter();
        
        expect(testItem.Supports(LookupKey.LongDOWDate, 'fr')).toBe(true);        
        expect(testItem.Supports('otherlookupkey', 'fr')).toBe(false);
    });

    test('en culture with various valid dates', () => {
        let testItem = new LongDOWDateLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.Format(date1, LookupKey.LongDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('Tuesday, October 31, 2000');
        expect(dts.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 2, 4, 0, 30);
        dts = testItem.Format(date2, LookupKey.LongDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('Wednesday, January 2, 1980');
        let date3 = new Date(1980, 0, 18, 16, 4, 0);        
        dts = testItem.Format(date3, LookupKey.LongDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('Friday, January 18, 1980');
    });

    test('fr culture with various valid dates', () => {
        let testItem = new LongDOWDateLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.Format(date1, LookupKey.LongDOWDate, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('mardi 31 octobre 2000');
        expect(dts.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 3, 4, 0, 30);
        dts = testItem.Format(date2, LookupKey.LongDOWDate, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('jeudi 3 janvier 1980');
        let date3 = new Date(1980, 0, 18, 16, 4, 0);        
        dts = testItem.Format(date3, LookupKey.LongDOWDate, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('vendredi 18 janvier 1980');
    });    
    test('null or undefined returns empty string', () => {
        let testItem = new LongDOWDateLocalizedFormatter();
        
        let dts = testItem.Format(null, LookupKey.LongDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(undefined, LookupKey.LongDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Values other than Date, null or undefined are errors', () => {
        let testItem = new LongDOWDateLocalizedFormatter();
        
        let dts = testItem.Format({}, LookupKey.LongDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
        
        dts = testItem.Format('', LookupKey.LongDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
        
        dts = testItem.Format(10, LookupKey.LongDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
            
        dts = testItem.Format(true, LookupKey.LongDOWDate, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
                
    });        
});
describe('TimeofDayLocalizedFormatter', () => {
    test('en: Supports LookupKey.TimeOfDay is true. Others are false', () => {
        let testItem = new TimeofDayLocalizedFormatter();
        
        expect(testItem.Supports(LookupKey.TimeOfDay, 'en')).toBe(true);        
        expect(testItem.Supports('otherlookupkey', 'en')).toBe(false);        
    });
    test('other cultures: Supports LookupKey.TimeOfDay is true. Others are false', () => {
        let testItem = new TimeofDayLocalizedFormatter();
        
        expect(testItem.Supports(LookupKey.TimeOfDay, 'otherculture')).toBe(true);        
        expect(testItem.Supports('otherlookupkey', 'otherculture')).toBe(false);        
    });
    test('en culture with various valid dates', () => {
        let testItem = new TimeofDayLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.Format(date1, LookupKey.TimeOfDay, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('12:00 AM');
        expect(dts.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dts = testItem.Format(date2, LookupKey.TimeOfDay, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('4:00 AM');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dts = testItem.Format(date3, LookupKey.TimeOfDay, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('4:04 PM');
    });

    test('fr culture with various valid dates', () => {
        let testItem = new TimeofDayLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.Format(date1, LookupKey.TimeOfDay, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('00:00');
        expect(dts.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dts = testItem.Format(date2, LookupKey.TimeOfDay, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('04:00');
        
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dts = testItem.Format(date3, LookupKey.TimeOfDay, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('16:04');
    });    
    test('null or undefined returns empty string', () => {
        let testItem = new TimeofDayLocalizedFormatter();
        
        let dts = testItem.Format(null, LookupKey.TimeOfDay, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(undefined, LookupKey.TimeOfDay, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('values other than Date, null or undefined are errors', () => {
        let testItem = new TimeofDayLocalizedFormatter();
        
        let dts = testItem.Format({}, LookupKey.TimeOfDay, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
        
        dts = testItem.Format('', LookupKey.TimeOfDay, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
        
        dts = testItem.Format(10, LookupKey.TimeOfDay, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
            
        dts = testItem.Format(true, LookupKey.TimeOfDay, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
                
    });    
});
describe('TimeofDayHMSLocalizedFormatter', () => {
    test('en: Supports LookupKey.TimeOfDayHMS is true. Others are false', () => {
        let testItem = new TimeofDayHMSLocalizedFormatter();
        
        expect(testItem.Supports(LookupKey.TimeOfDayHMS, 'en')).toBe(true);        
        expect(testItem.Supports('otherlookupkey', 'en')).toBe(false);        
    });
    test('other culture: Supports LookupKey.TimeOfDayHMS is true. Others are false', () => {
        let testItem = new TimeofDayHMSLocalizedFormatter();
        
        expect(testItem.Supports(LookupKey.TimeOfDayHMS, 'otherculture')).toBe(true);        
        expect(testItem.Supports('otherlookupkey', 'otherculture')).toBe(false);        
    });

    test('fr culture with various valid dates', () => {
        let testItem = new TimeofDayHMSLocalizedFormatter();
        
        let date1 = new Date(2000, 9, 31);
        let dts = testItem.Format(date1, LookupKey.TimeOfDayHMS, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('00:00:00');
        expect(dts.ErrorMessage).toBeUndefined();
        
        let date2 = new Date(1980, 0, 1, 4, 0, 30);
        dts = testItem.Format(date2, LookupKey.TimeOfDayHMS, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('04:00:30');
        let date3 = new Date(1980, 0, 15, 16, 4, 0);        
        dts = testItem.Format(date3, LookupKey.TimeOfDayHMS, 'fr');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('16:04:00');
    });    
    test('null or undefined returns empty string', () => {
        let testItem = new TimeofDayHMSLocalizedFormatter();
        
        let dts = testItem.Format(null, LookupKey.TimeOfDayHMS, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
        dts = testItem.Format(undefined, LookupKey.TimeOfDayHMS, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBe('');
        expect(dts.ErrorMessage).toBeUndefined();
        
    });
    test('Values other than Date, null or undefined are errors', () => {
        let testItem = new TimeofDayHMSLocalizedFormatter();
        
        let dts = testItem.Format({}, LookupKey.TimeOfDayHMS, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
        
        dts = testItem.Format('', LookupKey.TimeOfDayHMS, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
        
        dts = testItem.Format(10, LookupKey.TimeOfDayHMS, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
            
        dts = testItem.Format(true, LookupKey.TimeOfDayHMS, 'en');
        expect(dts).not.toBeNull();
        expect(dts.Value).toBeUndefined();
        expect(dts.ErrorMessage).toBe('Not a date');
                
    });        
});