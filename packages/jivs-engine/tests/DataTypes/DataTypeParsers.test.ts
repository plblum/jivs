import {
    StrongPatternParserBase, DataTypeParserOptions, SpecificCulturesPatternParserBase,
    DatePatternParserBase, DateTimeCultureInfo, NumberParserBase, NumberCultureInfo, BooleanParserBase,
    DataTypeParserBase
} from '../../src/DataTypes/DataTypeParserBase';
import { LookupKey } from '../../src/DataTypes/LookupKeys';
import { DataTypeResolution } from '../../src/Interfaces/DataTypes';
import { MockValidationServices } from '../TestSupport/mocks';
import {
    BooleanParser, CleanUpStringParser, CurrencyParser, EmptyStringIsFalseParser, NumberParser,
    Percentage100Parser, PercentageParser, ShortDatePatternParser
} from './../../src/DataTypes/DataTypeParsers';


describe('DataTypeParserBase', () => {
    
    class TestDataTypeParserBase extends DataTypeParserBase<string, DataTypeParserOptions<string>>
    {

        constructor(supportedLookupKey: string, options: DataTypeParserOptions<string>)
        {
            super(supportedLookupKey, options);
        }

        protected defaultEmptyStringResult(): string | null {
            return '';
        }        

        protected parseCleanedText(text: string, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<string | null> {
            return { value: text };
        }

        public get Publicify_hasServices(): boolean
        {
            return super.hasServices;
        }

    }    
    test('Constructor assigns supportedLookupKey and supports() matches only to supportedLookupKey', () => {
        let testItem = new TestDataTypeParserBase('KEY', {});
        expect(testItem.supportedLookupKey).toBe('KEY');
        expect(testItem.supports('KEY', 'does not matter', 'does not matter')).toBe(true);
        expect(testItem.supports('NOTKEY', 'does not matter', 'does not matter')).toBe(false);   
    });
    test('Constructor with null for options still sets up normally, demonstrated by trim working', () => {
        let testItem = new TestDataTypeParserBase('KEY', null!);
        expect(testItem.supportedLookupKey).toBe('KEY');
        expect(testItem.parse(' text ', 'KEY', 'does not matter')).toEqual({value: 'text'});
    });
    // trim    
    test('parse() should trim leading and trailing whitespace by default', () => {
        const parser = new TestDataTypeParserBase('lookupKey', {});
        const text = '   example   ';
        const result = parser.parse(text, 'lookupKey', 'en-US');
        expect(result.value).toBe('example');
    });
    test('parse() should trim leading and trailing whitespace when trim=true', () => {
        const parser = new TestDataTypeParserBase('lookupKey', { trim: true});
        const text = '   example   ';
        const result = parser.parse(text, 'lookupKey', 'en-US');
        expect(result.value).toBe('example');
    });

    test('parse() should not trim leading and trailing whitespace when trim=false', () => {
        const parser = new TestDataTypeParserBase('lookupKey', { trim: false });
        const text = '   example   ';
        const result = parser.parse(text, 'lookupKey', 'en-US');
        expect(result.value).toBe('   example   ');
    });
    test('parse() should trim leading whitespace by when trim=start', () => {
        const parser = new TestDataTypeParserBase('lookupKey', { trim: 'start'});
        const text = '   example   ';
        const result = parser.parse(text, 'lookupKey', 'en-US');
        expect(result.value).toBe('example   ');
    });
    test('parse() should trim trailing whitespace when trim=end', () => {
        const parser = new TestDataTypeParserBase('lookupKey', { trim: 'end'});
        const text = '   example   ';
        const result = parser.parse(text, 'lookupKey', 'en-US');
        expect(result.value).toBe('   example');
    });

    // emptyStringResult
    test('parse() should return empty string if input is empty string by default', () => {
        const parser = new TestDataTypeParserBase('lookupKey', {});
        const text = '';
        const result = parser.parse(text, 'lookupKey', 'en-US');
        expect(result.value).toBe('');
    });
    test('parse() should return empty string if input is empty string and emptyStringResult = the empty string', () => {
        const parser = new TestDataTypeParserBase('lookupKey', { emptyStringResult: ''});
        const text = '';
        const result = parser.parse(text, 'lookupKey', 'en-US');
        expect(result.value).toBe('');
    });
    test('parse() should return ! if input is empty string and emptyStringResult = !', () => {
        const parser = new TestDataTypeParserBase('lookupKey', { emptyStringResult: '!'});
        const text = '';
        const result = parser.parse(text, 'lookupKey', 'en-US');
        expect(result.value).toBe('!');
    });
    test('parse() should return null if input is empty string and emptyStringResult = null', () => {
        const parser = new TestDataTypeParserBase('lookupKey', { emptyStringResult: null});
        const text = '';
        const result = parser.parse(text, 'lookupKey', 'en-US');
        expect(result.value).toBe(null);
    });

    // Should return empty string result if input is only whitespace
    test('parse() should return empty string result when input is only whitespace', () => {
        const parser = new TestDataTypeParserBase('lookupKey', {});
        const text = '     ';
        const result = parser.parse(text, 'lookupKey', 'en-US');
        expect(result.value).toBe('');
    });
    test('Services that are unassigned throw', () => {
        let testItem = new TestDataTypeParserBase('lookupKey', {});
        expect(testItem.Publicify_hasServices).toBe(false);
        let x: any;
        expect(() => x = testItem.services).toThrow(/Register/);
    });
    test('Services to return same ValidationService as assigned', () => {
        let services = new MockValidationServices(false, false);
        let testItem = new TestDataTypeParserBase('lookupKey', {});
        expect(() => testItem.services = services).not.toThrow();
        expect(testItem.services).toBe(services);
        expect(testItem.Publicify_hasServices).toBe(true);
    });

    test('dispose then get services throws TypeError', () => {
        let services = new MockValidationServices(false, false);
        let testItem = new TestDataTypeParserBase('lookupKey', {});
        testItem.services = services;
        testItem.dispose();
        expect(()=> testItem.services).toThrow(TypeError);
    });    
});

describe('CleanUpStringParser', () => {

    // Should remove specified characters from input string
    test('parse() should remove specified characters from input string', () => {
        const testItem = new CleanUpStringParser('lookupKey', { stripTheseCharacters: '-!'});
        const text = '!203 - 533 - (3999)';
        const result = testItem.parse(text, 'lookupKey', 'en-US');
        expect(result.value).toBe('203  533  (3999)');
    });

    // Should return the original string if stripTheseCharacters is set to an empty string
    test('parse() should return the original string if stripTheseCharacters is empty string', () => {
        const testItem = new CleanUpStringParser('lookupKey', {stripTheseCharacters: ''});
        const text = 'example';
        const result = testItem.parse(text, 'lookupKey', 'en-US');
        expect(result.value).toBe('example');
    });

    // Should replace multiple whitespace characters with a single whitespace character
    test('parse() should replace multiple whitespace characters with a single whitespace character', () => {
        const testItem = new CleanUpStringParser('lookupKey', {compressWhitespace: true, trim: false});
        const text = '   example   text   ';
        const result = testItem.parse(text, 'lookupKey', 'en-US');
        expect(result.value).toBe(' example text ');
    });
    test('parse() should replace multiple whitespace characters that include tab and crlf with a single whitespace character', () => {
        const testItem = new CleanUpStringParser('lookupKey', {compressWhitespace: true, trim: false});
        const text = '   example \t  text \n\r  ';
        const result = testItem.parse(text, 'lookupKey', 'en-US');
        expect(result.value).toBe(' example text ');
    });
    // Should replace whitespace characters with specified character
    test('parse() should replace whitespace characters with specified character when replaceWhitespace is set', () => {
        const testItem = new CleanUpStringParser('lookupKey', { replaceWhitespace: '-'});
        const text = 'example text is here';
        const result = testItem.parse(text, 'lookupKey', 'en-US');
        expect(result.value).toBe('example-text-is-here');
    });

    // Should convert input string to lowercase
    test('parse() should convert input string to lowercase when convertCase is set to \'lower\'', () => {
        const testItem = new CleanUpStringParser('lookupKey', { convertCase: 'lower'});
        const text = 'EXAMPLE TEXT';
        const result = testItem.parse(text, 'lookupKey', 'en-US');
        expect(result.value).toBe('example text');
    });

    // Should convert input string to uppercase
    test('parse() should convert input string to uppercase when convertCase is set to \'upper\'', () => {
        const testItem = new CleanUpStringParser('lookupKey', { convertCase: 'upper'});
        const text = 'example text';
        const result = testItem.parse(text, 'lookupKey', 'en-US');
        expect(result.value).toBe('EXAMPLE TEXT');
    });

    // Should return empty string if input is only whitespace and emptyStringResult is null
    test('parse() should return empty string if input is only whitespace and emptyStringResult is null', () => {
        const testItem = new CleanUpStringParser('lookupKey', { emptyStringResult: null});
        const text = '   ';
        const result = testItem.parse(text, 'lookupKey', 'en-US');
        expect(result.value).toBeNull();
    });

    // The test should check if the original string is returned when the replaceWhitespace property is null and the input contains whitespace.
    test('parse() should return the original string if replaceWhitespace is null and input contains whitespace', () => {
        const testItem = new CleanUpStringParser('lookupKey', {replaceWhitespace: null});
        const text = 'e x a m p l e ';
        const result = testItem.parse(text, 'lookupKey', 'en-US');
        expect(result.value).toBe('e x a m p l e');
    });
});

describe('StrongPatternParserBase', () => {
    class TestStrongPatternParserBase extends StrongPatternParserBase<number, DataTypeParserOptions<number>>
    {
        constructor(supportedLookupKey: string)
        {
            super(supportedLookupKey, {});
        }

        protected defaultEmptyStringResult(): number | null {
            return 0;
        }        
        public createdRegExCount: number = 0;

        protected createRegExp(dataTypeLookupKey: string, cultureId: string): RegExp
        {
            this.createdRegExCount++;
            return /^\d\d$/;
        }
        protected processPattern(pattern: RegExpExecArray, text: string, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<number> {
            return { value: parseInt(pattern[0], 10) };
        }
        protected patternDidNotMatchMessage(): string {
            return 'ERROR';
        }
    }    
    test('Constructor assigns supportedLookupKey and supports() matches only to it and text with 2 digits', () => {
        let testItem = new TestStrongPatternParserBase('KEY');
        expect(testItem.supportedLookupKey).toBe('KEY');
        expect(testItem.supports('KEY', '', '00')).toBe(true);
        expect(testItem.supports('NOTKEY', '', '00')).toBe(false);
        expect(testItem.supports('KEY', '', 'a0')).toBe(false);        
    });
    test('parse() calls createRegExp only once, but always returns the correct result', () => {
        let testItem = new TestStrongPatternParserBase('KEY');
        expect(testItem.createdRegExCount).toBe(0);
        expect(testItem.parse('00', 'KEY', 'en')).toEqual({ value: 0 });
        expect(testItem.createdRegExCount).toBe(1);
        expect(testItem.parse('10', 'KEY', 'en')).toEqual({ value: 10 });
        expect(testItem.createdRegExCount).toBe(1);
    });
    test('parse() returns an error message when the pattern does not match', () => {
        let testItem = new TestStrongPatternParserBase('KEY');
        
        expect(testItem.parse('ABC', 'KEY', 'en')).toEqual({ errorMessage: "ERROR" });
    });
});

describe('SpecificCulturesPatternParserBase', () => {
    class TestSpecificCulturesPatternParserBase extends SpecificCulturesPatternParserBase<number, DataTypeParserOptions<number>> {
        constructor(supportedLookupKey: string, supportedCultures: Array<string>)
        {
            super(supportedLookupKey, supportedCultures, {});
        }
        protected defaultEmptyStringResult(): number | null {
            return 0;
        }        

        protected createRegExp(dataTypeLookupKey: string, cultureId: string): RegExp
        {
            return /^\d\d$/;
        }
        protected processPattern(pattern: RegExpExecArray, text: string, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<number> {
            return { value: parseInt(pattern[0], 10) };
        }
        protected patternDidNotMatchMessage(): string {
            return 'ERROR';
        }
    }
    test('constructor with valid parameters does not throw and parameters are assigned to correct properties.', () => {
        let testItem: TestSpecificCulturesPatternParserBase;
   
        expect(() => testItem = new TestSpecificCulturesPatternParserBase('KEY', ['en-US'])).not.toThrow();
        expect(testItem!.supportedLookupKey).toBe('KEY');
        expect(testItem!.supportedCultures).toEqual(['en-US']);
    });
    test('constructor with null suppportedCultures throws.', () => {
        let testItem: TestSpecificCulturesPatternParserBase;
        expect(() => testItem = new TestSpecificCulturesPatternParserBase('KEY', null!)).toThrow(/supportedCultures/);

    });    
    test('constructor with empty array for suppportedCultures throws.', () => {
        let testItem: TestSpecificCulturesPatternParserBase;
        expect(() => testItem = new TestSpecificCulturesPatternParserBase('KEY', [])).toThrow(/Missing/);

    });    
    test('support with parameters that match requirements returns true and those that do not match return false.', () => {
        let testItem = new TestSpecificCulturesPatternParserBase('KEY', ['en-US', 'en']);
        expect(testItem.supports('KEY', 'en-US', '12')).toBe(true);
        expect(testItem.supports('KEY', '', '12')).toBe(false);     
        expect(testItem.supports('KEY', 'en', '12')).toBe(true);            
        expect(testItem.supports('KEY', 'fr', '12')).toBe(false);         
        expect(testItem.supports('WRONGKEY', 'en', '12')).toBe(false);      
        expect(testItem.supports('KEY', 'en', 'ab')).toBe(false);              
    });    
    test('parse with text that has 2 digits returns a number and others do not, all the while proving that lookupKey and culture are ignored.', () => {
        let testItem = new TestSpecificCulturesPatternParserBase('KEY', ['en-US']);
        expect(testItem!.parse('12', 'KEY', 'en-US')).toEqual({ value: 12 });
        expect(testItem!.parse('12', 'KEY', '')).toEqual({ value: 12 });
        expect(testItem!.parse('12', 'KEY', 'en')).toEqual({ value: 12 });
        expect(testItem!.parse('12', 'KEY', 'fr')).toEqual({ value: 12 });
        expect(testItem!.parse('12', 'WRONGKEY', 'en-US')).toEqual({ value: 12 });
        expect(testItem!.parse('1', 'KEY', 'en-US')).toEqual({ errorMessage: 'ERROR' });
        expect(testItem!.parse('ab', 'KEY', 'en-US')).toEqual({ errorMessage: 'ERROR' });
    });       
});

describe('DatePatternParserBase', () => {
    class TestDatePatternParserBase extends DatePatternParserBase<DateTimeCultureInfo> {
        constructor(supportedLookupKey: string, supportedCultures: Array<string>, options: DateTimeCultureInfo, utc?: boolean)
        {
            super(supportedLookupKey, supportedCultures, options, utc);
        }

        // We don't actually care about this part.
        protected createRegExp(dataTypeLookupKey: string, cultureId: string): RegExp
        {
            return /^\d\d$/;
        }
        // we don't actually care about this part.
        protected processPattern(pattern: RegExpExecArray, text: string, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<Date> {
            return { value: new Date() };
        }

        public publicify_toDate(year: number, month: number, day: number): DataTypeResolution<Date>
        {
            return super.toDate(year, month, day);
        }
    }

    test('constructor with UTC=true and mdy does not throw and parameters are assigned to correct properties.', () => {
        let testItem: TestDatePatternParserBase;
        expect(() => testItem = new TestDatePatternParserBase('KEY', ['en-US'], { order: 'mdy', shortDateSeparator:'/' }, true)).not.toThrow();
        expect(testItem!.utc).toBe(true);
    });   
    test('constructor with utc omitted does not throw and becomes utc=true.', () => {
        let testItem: TestDatePatternParserBase;
        expect(() => testItem = new TestDatePatternParserBase('KEY', ['en-US'], { order: 'mdy', shortDateSeparator: '/' })).not.toThrow();
        expect(testItem!.utc).toBe(true);

    });        
    test('constructor with UTC=false and dmy does not throw and parameters are assigned to correct properties.', () => {
        let testItem: TestDatePatternParserBase;
        expect(() => testItem = new TestDatePatternParserBase('KEY', ['en-US'], { order: 'dmy', shortDateSeparator: '/' }, false)).not.toThrow();
        expect(testItem!.utc).toBe(false);        
    });        
    test('constructor with order=null throws.', () => {
        let testItem: TestDatePatternParserBase;
        expect(() => new TestDatePatternParserBase('KEY', ['en-US'], { order: null!, shortDateSeparator:'/' }, false)).toThrow(/order/);
    });            
  
    test('parse with empty string returns null, demonstrating emptyStringResult is correctly initialized', () => {
        let testItem = new TestDatePatternParserBase('KEY', ['en'], { order: 'mdy', shortDateSeparator:'/' }, true);
        expect(testItem.parse('', 'KEY', 'en')).toEqual({ value: null });
    });

    test('toDate with UTC=true resolves to a Date object with valid date values', () => {
        let testItem = new TestDatePatternParserBase('KEY', ['en'], { order: 'mdy', shortDateSeparator:'/' }, true);
        let result: DataTypeResolution<Date>;
        expect(()=> result = testItem.publicify_toDate(2000, 0, 1)).not.toThrow();
        expect(result!.value).toBeInstanceOf(Date);
        expect(result!.value!.getUTCFullYear()).toEqual(2000);
        expect(result!.value!.getUTCMonth()).toEqual(0);
        expect(result!.value!.getUTCDate()).toEqual(1);

        result = testItem.publicify_toDate(2099, 11, 31);
        expect(result.value).toBeInstanceOf(Date);
        expect(result.value?.getTime()).toEqual(new Date(Date.UTC(2099, 11, 31)).getTime());

        result = testItem.publicify_toDate(1990, 5, 1);
        expect(result.value).toBeInstanceOf(Date);
        expect(result.value?.getTime()).toEqual(new Date(Date.UTC(1990, 5, 1)).getTime());
    });
    test('toDate with UTC=true reports "Values not allowed" when parameters cannot create a Date object', () => {
        let testItem = new TestDatePatternParserBase('KEY', ['en'], { order: 'mdy', shortDateSeparator:'/' }, true);
        let result: DataTypeResolution<Date>;
        expect(()=> result = testItem.publicify_toDate('a' as any, 0, 1)).not.toThrow();
        expect(result!).toEqual({ errorMessage: DatePatternParserBase.badDataMessage });
    });    
    test('toDate with UTC=true reports "Invalid date" when parameters are out of range', () => {
        let testItem = new TestDatePatternParserBase('KEY', ['en'], { order: 'mdy', shortDateSeparator:'/' }, true);
        let result: DataTypeResolution<Date>;
        expect(()=> result = testItem.publicify_toDate(2000, -1, 1)).not.toThrow();
        expect(result!).toEqual({ errorMessage: DatePatternParserBase.invalidDateMessage });

        result = testItem.publicify_toDate(2000, 12, 1);
        expect(result!).toEqual({ errorMessage: DatePatternParserBase.invalidDateMessage });

        result = testItem.publicify_toDate(1990, 0, 0);
        expect(result!).toEqual({ errorMessage: DatePatternParserBase.invalidDateMessage });

        result = testItem.publicify_toDate(1990, 0, 32);
        expect(result!).toEqual({ errorMessage: DatePatternParserBase.invalidDateMessage });        

        result = testItem.publicify_toDate(2001, 1, 29);    // not a leap year
        expect(result!).toEqual({ errorMessage: DatePatternParserBase.invalidDateMessage });        

        result = testItem.publicify_toDate(2004, 1, 30);    // leap year
        expect(result!).toEqual({ errorMessage: DatePatternParserBase.invalidDateMessage });              
    });


    test('toDate with UTC=false resolves to a Date object with valid date values', () => {
        let testItem = new TestDatePatternParserBase('KEY', ['en'], { order: 'mdy', shortDateSeparator:'/' }, false);
        let result: DataTypeResolution<Date>;
        expect(()=> result = testItem.publicify_toDate(2000, 0, 1)).not.toThrow();
        expect(result!.value).toBeInstanceOf(Date);
        expect(result!.value!.getFullYear()).toEqual(2000);
        expect(result!.value!.getMonth()).toEqual(0);
        expect(result!.value!.getDate()).toEqual(1);

        result = testItem.publicify_toDate(2099, 11, 31);
        expect(result.value).toBeInstanceOf(Date);
        expect(result.value?.getTime()).toEqual(new Date(2099, 11, 31).getTime());

        result = testItem.publicify_toDate(1990, 5, 1);
        expect(result.value).toBeInstanceOf(Date);
        expect(result.value?.getTime()).toEqual(new Date(1990, 5, 1).getTime());
    });    
});

describe('ShortDatePatternParser', () => {
    test('constructor with valid parameters sets up properties correctly', () => {
        let testItem = new ShortDatePatternParser('SHORT', ['en'], { order: 'mdy', shortDateSeparator: '/' }, true);   // effectively US short date pattern
        expect(testItem.supportedLookupKey).toBe('SHORT');
        expect(testItem.supportedCultures).toEqual(['en']);
        expect(testItem.utc).toBe(true);        
    });
    test('constructor with valid parameters but omits utc parameter sets up properties correctly', () => {
        let testItem = new ShortDatePatternParser('SHORT', ['en'], { order: 'mdy', shortDateSeparator: '/' });   // effectively US short date pattern
        expect(testItem.supportedLookupKey).toBe('SHORT');
        expect(testItem.supportedCultures).toEqual(['en']);
        expect(testItem.utc).toBe(true);
    });    
    test('constructor with valid parameters where UTC=false sets up properties correctly', () => {
        let testItem = new ShortDatePatternParser('SHORT', ['en'], { order: 'mdy', shortDateSeparator: '/' }, false);   // effectively US short date pattern
        expect(testItem.supportedLookupKey).toBe('SHORT');
        expect(testItem.supportedCultures).toEqual(['en']);
        expect(testItem.utc).toBe(false);
    });       
    test('constructor with null order parameter throws', () => {
        expect(()=> new ShortDatePatternParser('SHORT', ['en'], { order: null!, shortDateSeparator: '/' }, true)).toThrow(/order/); 
    });    
    test('constructor with null separator parameter throws', () => {
        expect(()=> new ShortDatePatternParser('SHORT', ['en'], { order: 'mdy', shortDateSeparator: null! }, true)).toThrow(/shortDateSeparator/); 
    });        
    test('constructor with separator parameter containing empty string throws', () => {
        expect(()=> new ShortDatePatternParser('SHORT', ['en'], { order: 'mdy', shortDateSeparator: '' }, true)).toThrow(/shortDateSeparator option required/); 
    });
    test('support with parameters that match requirements returns true and those that do not match return false.', () => {
        let testItem = new ShortDatePatternParser('SHORT', ['en', 'en-US'], { order: 'mdy', shortDateSeparator: '/' }, true);
        expect(testItem.supports('SHORT', 'en-US', '12/01/2000')).toBe(true);
        expect(testItem.supports('SHORT', '', '12/01/2000')).toBe(false);     
        expect(testItem.supports('SHORT', 'en', '12/01/2000')).toBe(true);            
        expect(testItem.supports('SHORT', 'fr', '12/01/2000')).toBe(false);         
        expect(testItem.supports('WRONGKEY', 'en', '12/01/2000')).toBe(false);      
        expect(testItem.supports('SHORT', 'en', 'ab')).toBe(false);              
    });    

    test('parse with text that matches mdy order and is a valid date returns a Date object', () => {
        let testItem = new ShortDatePatternParser('SHORT', ['en', 'en-US'], { order: 'mdy', shortDateSeparator: '/' }, true);
        expect(testItem!.parse('12/01/2000', 'SHORT', 'en-US')).toEqual({ value: new Date(Date.UTC(2000, 11, 1)) });
        expect(testItem!.parse('12/1/2000', 'SHORT', 'en-US')).toEqual({ value: new Date(Date.UTC(2000, 11, 1)) });
        expect(testItem!.parse('1/15/2001', 'SHORT', 'en-US')).toEqual({ value: new Date(Date.UTC(2001, 0, 15)) });
        expect(testItem!.parse('01/15/2001', 'SHORT', 'en-US')).toEqual({ value: new Date(Date.UTC(2001, 0, 15)) });
        expect(testItem!.parse('5/31/1965', 'SHORT', 'en-US')).toEqual({ value: new Date(Date.UTC(1965, 4, 31)) });
        expect(testItem!.parse('05/31/1965', 'SHORT', 'en-US')).toEqual({ value: new Date(Date.UTC(1965, 4, 31)) });
        expect(testItem!.parse('   05/31/1965   ', 'SHORT', 'en-US')).toEqual({ value: new Date(Date.UTC(1965, 4, 31)) });
    });           

    test('parse with text with option.twoDigitYearBreak=50 changes 2 digit years to 2000-2050 and 1950-1999', () => {
        let testItem = new ShortDatePatternParser('SHORT', ['en', 'en-US'], {
            order: 'mdy', shortDateSeparator: '/',
            twoDigitYearBreak: 50
         }, true);
        expect(testItem!.parse('12/01/00', 'SHORT', 'en-US')).toEqual({ value: new Date(Date.UTC(2000, 11, 1)) });
        expect(testItem!.parse('1/15/01', 'SHORT', 'en-US')).toEqual({ value: new Date(Date.UTC(2001, 0, 15)) });
        expect(testItem!.parse('5/31/50', 'SHORT', 'en-US')).toEqual({ value: new Date(Date.UTC(2050, 4, 31)) });
        expect(testItem!.parse('5/31/65', 'SHORT', 'en-US')).toEqual({ value: new Date(Date.UTC(1965, 4, 31)) });
        expect(testItem!.parse('05/31/1951', 'SHORT', 'en-US')).toEqual({ value: new Date(Date.UTC(1951, 4, 31)) });
    });            
    test('parse with text does not conform to the date pattern returns an error message', () => {
        let testItem = new ShortDatePatternParser('SHORT', ['en', 'en-US'], { order: 'mdy', shortDateSeparator: '/' }, true);
        expect(testItem!.parse('120/01/2000', 'SHORT', 'en-US')).toEqual({ errorMessage: DatePatternParserBase.badDataMessage });
        expect(testItem!.parse('12/001/2000', 'SHORT', 'en-US')).toEqual({ errorMessage: DatePatternParserBase.badDataMessage });
        expect(testItem!.parse('5/31', 'SHORT', 'en-US')).toEqual({ errorMessage: DatePatternParserBase.badDataMessage });
        expect(testItem!.parse('garbage', 'SHORT', 'en-US')).toEqual({ errorMessage: DatePatternParserBase.badDataMessage });
        expect(testItem!.parse('12-01-2000', 'SHORT', 'en-US')).toEqual({ errorMessage: DatePatternParserBase.badDataMessage });     
        expect(testItem!.parse('12012000', 'SHORT', 'en-US')).toEqual({ errorMessage: DatePatternParserBase.badDataMessage });        
        expect(testItem!.parse('12 / 01 / 2000', 'SHORT', 'en-US')).toEqual({ errorMessage: DatePatternParserBase.badDataMessage });
    });    
    test('parse with text that matches mdy order and but has values out or range returns an out of range error message', () => {
        let testItem = new ShortDatePatternParser('SHORT', ['en', 'en-US'], { order: 'mdy', shortDateSeparator: '/' }, true);
        expect(testItem!.parse('13/01/2000', 'SHORT', 'en-US')).toEqual({ errorMessage: DatePatternParserBase.invalidDateMessage });
        expect(testItem!.parse('12/0/2000', 'SHORT', 'en-US')).toEqual({ errorMessage: DatePatternParserBase.invalidDateMessage });
        expect(testItem!.parse('0/15/2001', 'SHORT', 'en-US')).toEqual({ errorMessage: DatePatternParserBase.invalidDateMessage });
        expect(testItem!.parse('01/32/2001', 'SHORT', 'en-US')).toEqual({ errorMessage: DatePatternParserBase.invalidDateMessage });
    });          
    test('parse with text that matches dmy order and is a valid date returns a Date object', () => {
        let testItem = new ShortDatePatternParser('SHORT', ['en-GB'], { order: 'dmy', shortDateSeparator: '/' }, true);
        expect(testItem!.parse('01/12/2000', 'SHORT', 'en-GB')).toEqual({ value: new Date(Date.UTC(2000, 11, 1)) });
        expect(testItem!.parse('1/12/2000', 'SHORT', 'en-GB')).toEqual({ value: new Date(Date.UTC(2000, 11, 1)) });
        expect(testItem!.parse('15/1/2001', 'SHORT', 'en-GB')).toEqual({ value: new Date(Date.UTC(2001, 0, 15)) });
        expect(testItem!.parse('15/01/2001', 'SHORT', 'en-GB')).toEqual({ value: new Date(Date.UTC(2001, 0, 15)) });
        expect(testItem!.parse('31/5/1965', 'SHORT', 'en-GB')).toEqual({ value: new Date(Date.UTC(1965, 4, 31)) });
        expect(testItem!.parse('31/05/1965', 'SHORT', 'en-GB')).toEqual({ value: new Date(Date.UTC(1965, 4, 31)) });
    });              
    test('parse with text that matches ymd order with period as separator and is a valid date returns a Date object', () => {
        let testItem = new ShortDatePatternParser('SHORT', ['en', 'en-US'],{ order: 'ymd', shortDateSeparator: '.' }, true);
        expect(testItem!.parse('2000.12.01', 'SHORT', 'en-US')).toEqual({ value: new Date(Date.UTC(2000, 11, 1)) });
        expect(testItem!.parse('2000.12.1', 'SHORT', 'en-US')).toEqual({ value: new Date(Date.UTC(2000, 11, 1)) });
        expect(testItem!.parse('2001.1.15', 'SHORT', 'en-US')).toEqual({ value: new Date(Date.UTC(2001, 0, 15)) });
        expect(testItem!.parse('2001.01.15', 'SHORT', 'en-US')).toEqual({ value: new Date(Date.UTC(2001, 0, 15)) });
        expect(testItem!.parse('1965.5.31', 'SHORT', 'en-US')).toEqual({ value: new Date(Date.UTC(1965, 4, 31)) });
        expect(testItem!.parse('1965.05.31', 'SHORT', 'en-US')).toEqual({ value: new Date(Date.UTC(1965, 4, 31)) });
    });              

    test('parse with text that matches ydm order with space as separator and is a valid date returns a Date object', () => {
        let testItem = new ShortDatePatternParser('SHORT', ['en', 'en-US'], { order: 'ydm', shortDateSeparator: ' ' }, true);
        expect(testItem!.parse('2000 01 12', 'SHORT', 'en-US')).toEqual({ value: new Date(Date.UTC(2000, 11, 1)) });
        expect(testItem!.parse('2000 1 12', 'SHORT', 'en-US')).toEqual({ value: new Date(Date.UTC(2000, 11, 1)) });
        expect(testItem!.parse('2001 15 1', 'SHORT', 'en-US')).toEqual({ value: new Date(Date.UTC(2001, 0, 15)) });
        expect(testItem!.parse('2001 15 01', 'SHORT', 'en-US')).toEqual({ value: new Date(Date.UTC(2001, 0, 15)) });
        expect(testItem!.parse('1965 31 5', 'SHORT', 'en-US')).toEqual({ value: new Date(Date.UTC(1965, 4, 31)) });
        expect(testItem!.parse('1965 31 05', 'SHORT', 'en-US')).toEqual({ value: new Date(Date.UTC(1965, 4, 31)) });
    });             
});

describe('NumberParserBase', () => {
    class TestNumberParserBase extends NumberParserBase<NumberCultureInfo>
    {
        
    }
    test('constructor sets all parameters into properties', () => {
        let testItem = new TestNumberParserBase('KEY', ['en-US'],
            {
                decimalSeparator: '.', negativeSymbol: '-', thousandsSeparator: ',',
                currencySymbol: '$', percentSymbol: '%'
             });
        
        expect(testItem.supportedLookupKey).toBe('KEY');
        expect(testItem.supportedCultures).toEqual(['en-US']);
    });
    test('constructor with null decimalSeparator throws', () => {
        expect(()=>
        new TestNumberParserBase('KEY', ['en-US'],
            {
                decimalSeparator: null!, negativeSymbol: '-', thousandsSeparator: ',',
                currencySymbol: '$', percentSymbol: '%'
             })).toThrow(/decimalSeparator/);
        
    });
    test('constructor with "" decimalSeparator throws', () => {
        expect(()=>
        new TestNumberParserBase('KEY', ['en-US'],
            {
                decimalSeparator: '', negativeSymbol: '-', thousandsSeparator: ',',
                currencySymbol: '$', percentSymbol: '%'
             })).toThrow(/decimalSeparator option required/);
        
    });
    test('constructor with null negativeSymbol throws', () => {
        expect(()=>
        new TestNumberParserBase('KEY', ['en-US'],
            {
                decimalSeparator: '.', negativeSymbol: null!, thousandsSeparator: ',',
                currencySymbol: '$', percentSymbol: '%'
             })).toThrow(/negativeSymbol/);
    });    
    test('constructor with "" negativeSymbol throws', () => {
        expect(() =>
            new TestNumberParserBase('KEY', ['en-US'],
                {
                    decimalSeparator: '.', negativeSymbol: '', thousandsSeparator: ',',
                    currencySymbol: '$', percentSymbol: '%'
                })).toThrow(/negativeSymbol option required/);
    });        
    test('supports() with positive float without thousands separators or using strip these strings', () => {
        let testItem = new TestNumberParserBase('KEY', ['en', 'en-US'],
            {
                decimalSeparator: '.', negativeSymbol: '-', thousandsSeparator: null,
                parenthesisAsNegative: undefined,
                currencySymbol: '$', percentSymbol: '%' // these are ignored, the stripTheseStrings parameter is used instead
            });
        expect(testItem.supports('KEY', 'en', '1')).toBe(true);
        expect(testItem.supports('KEY', 'en', '-1')).toBe(true); 
        expect(testItem.supports('WRONGKEY', 'en', '1')).toBe(false);
        expect(testItem.supports('KEY', 'fr', '1')).toBe(false);
        expect(testItem.supports('KEY', 'en', '1000')).toBe(true);
        expect(testItem.supports('KEY', 'en', '1.5')).toBe(true);
        expect(testItem.supports('KEY', 'en', ' 1 ')).toBe(true);
        expect(testItem.supports('KEY', 'en', '.5')).toBe(true);    
        expect(testItem.supports('KEY', 'en', '1.')).toBe(true);      
        expect(testItem.supports('KEY', 'en', '1.0')).toBe(true);        
        expect(testItem.supports('KEY', 'en', '$1.0')).toBe(false);        
        expect(testItem.supports('KEY', 'en', '1.0%')).toBe(false);        
        expect(testItem.supports('KEY', 'en', '$-1')).toBe(false);        
        expect(testItem.supports('KEY', 'en', '-1%')).toBe(false);

        // text contains an illegal value, such as unexpected character, but let the parser reject it
        expect(testItem.supports('KEY', 'en', '(1)')).toBe(true); // no ()
        expect(testItem.supports('KEY', 'en', '1,000')).toBe(true); // thousands separator was not defined. So comma is unexpected
        expect(testItem.supports('KEY', 'en', 'A1')).toBe(true);    // no letters
        expect(testItem.supports('KEY', 'en', 'ABC')).toBe(true);      
        expect(testItem.supports('KEY', 'en', '!')).toBe(true);        // no !
        expect(testItem.supports('KEY', 'en', '1!')).toBe(true);           
        expect(testItem.supports('KEY', 'en', '!1')).toBe(true);      
        expect(testItem.supports('KEY', 'en', 'USD $1.00')).toBe(true); 
        expect(testItem.supports('KEY', 'en', '$1.00USD')).toBe(true);   
        expect(testItem.supports('KEY', 'en', 'USD1.00')).toBe(true);            
        
        // values that cannot be numbers are still supported, and later rejected by parse()
        expect(testItem.supports('KEY', 'en', '1..5')).toBe(true);      
        expect(testItem.supports('KEY', 'en', '.1.5')).toBe(true);  
        expect(testItem.supports('KEY', 'en', '(1.5(')).toBe(true);  
        expect(testItem.supports('KEY', 'en', ')1.5)')).toBe(true);  
        expect(testItem.supports('KEY', 'en', '--1.5')).toBe(true);          
        expect(testItem.supports('KEY', 'en', '-1.5-')).toBe(true);        
        expect(testItem.supports('KEY', 'en', '1-5')).toBe(true);         
        expect(testItem.supports('KEY', 'en', '1(5')).toBe(true);  
        expect(testItem.supports('KEY', 'en', '1)5')).toBe(true);
    });
    test('supports() with any float with thousands separators and currency or percent symbol', () => {
        let testItem = new TestNumberParserBase('KEY', ['en', 'en-US'],
        {
            decimalSeparator: '.', negativeSymbol: '-', thousandsSeparator: ',',
            parenthesisAsNegative: true,
            currencySymbol: '$', percentSymbol: '%' // these are ignored, the stripTheseStrings parameter is used instead
            }, ['%', '$']);
        // values that can be seen as numbers, after cleanup
        expect(testItem.supports('KEY', 'en', '1')).toBe(true);
        expect(testItem.supports('KEY', 'en', '-1')).toBe(true);
        expect(testItem.supports('KEY', 'en', '(1)')).toBe(true);
        expect(testItem.supports('KEY', 'en', '- 1')).toBe(true);
        expect(testItem.supports('KEY', 'en', '$1')).toBe(true);
        expect(testItem.supports('KEY', 'en', '$-1')).toBe(true);
        expect(testItem.supports('KEY', 'en', '$ -1')).toBe(true);
        expect(testItem.supports('KEY', 'en', '1%')).toBe(true);
        expect(testItem.supports('KEY', 'en', '-1%')).toBe(true); 
        expect(testItem.supports('KEY', 'en', '$ 1')).toBe(true);
        expect(testItem.supports('KEY', 'en', '1 %')).toBe(true);
        expect(testItem.supports('KEY', 'en', '1,000')).toBe(true);
        expect(testItem.supports('KEY', 'en', '1.5')).toBe(true); 
        expect(testItem.supports('KEY', 'en', ' 1.5 ')).toBe(true);
        expect(testItem.supports('KEY', 'en', '1.1')).toBe(true);
        expect(testItem.supports('KEY', 'en', '-1.0')).toBe(true);
        expect(testItem.supports('KEY', 'en', '- 1.6')).toBe(true);
        expect(testItem.supports('KEY', 'en', '$1.0')).toBe(true);
        expect(testItem.supports('KEY', 'en', '$-1.99')).toBe(true);
        expect(testItem.supports('KEY', 'en', '$ -1.103')).toBe(true);
        expect(testItem.supports('KEY', 'en', '1.9%')).toBe(true);
        expect(testItem.supports('KEY', 'en', '-1.0%')).toBe(true); 
        expect(testItem.supports('KEY', 'en', '$ 1.00')).toBe(true);
        expect(testItem.supports('KEY', 'en', '1.1 %')).toBe(true);
        expect(testItem.supports('KEY', 'en', '1,000.99')).toBe(true);
        expect(testItem.supports('KEY', 'en', '(1')).toBe(true);
        expect(testItem.supports('KEY', 'en', '1)')).toBe(true);
        // empty string cases use default empty string
        expect(testItem.supports('KEY', 'en', '')).toBe(true);     
        expect(testItem.supports('KEY', 'en', '  ')).toBe(true);    

        // values that cannot be numbers are still supported, and later rejected by parse()
        expect(testItem.supports('KEY', 'en', 'A1')).toBe(true);    
        expect(testItem.supports('KEY', 'en', '!')).toBe(true);        
        expect(testItem.supports('KEY', 'en', '1!')).toBe(true);           
        expect(testItem.supports('KEY', 'en', '!1')).toBe(true);           
        expect(testItem.supports('KEY', 'en', 'ABC')).toBe(true);      
        expect(testItem.supports('KEY', 'en', '1..5')).toBe(true);      
        expect(testItem.supports('KEY', 'en', '.1.5')).toBe(true);  
        expect(testItem.supports('KEY', 'en', '(1.5(')).toBe(true);  
        expect(testItem.supports('KEY', 'en', ')1.5)')).toBe(true);  
        expect(testItem.supports('KEY', 'en', '--1.5')).toBe(true);          
        expect(testItem.supports('KEY', 'en', '-1.5-')).toBe(true);        
        expect(testItem.supports('KEY', 'en', '1-5')).toBe(true);         
        expect(testItem.supports('KEY', 'en', '1(5')).toBe(true);  
        expect(testItem.supports('KEY', 'en', '1)5')).toBe(true);
        expect(testItem.supports('KEY', 'en', 'USD $1.00')).toBe(true); 
        expect(testItem.supports('KEY', 'en', '$1.00USD')).toBe(true);   
        expect(testItem.supports('KEY', 'en', 'USD1.00')).toBe(true);         
        // non-value parameters that don't match
        expect(testItem.supports('WRONGKEY', 'en', '1')).toBe(false);
        expect(testItem.supports('KEY', 'fr', '1')).toBe(false);
          
    });    
    test('parse() with number without thousands separators, (), and characters to strip', () => {
        const errResult = { errorMessage: NumberParserBase.badNumberMessage };
        let testItem = new TestNumberParserBase('KEY', ['en', 'en-US'],
        {
            decimalSeparator: '.', negativeSymbol: '-', thousandsSeparator: null,
            parenthesisAsNegative: undefined,
            currencySymbol: '$', percentSymbol: '%' // these are ignored, the stripTheseStrings parameter is used instead
         });
        expect(testItem.parse('1', 'KEY', 'en')).toEqual({ value: 1 });
        expect(testItem.parse('-1', 'KEY', 'en')).toEqual({ value: -1}); 
        expect(testItem.parse('1-', 'KEY', 'en')).toEqual({ value: -1}); 
        expect(testItem.parse('1.5', 'KEY', 'en')).toEqual({ value: 1.5 }); 
        expect(testItem.parse(' 1 ', 'KEY', 'en')).toEqual({ value: 1 });
        expect(testItem.parse('.5', 'KEY', 'en')).toEqual({ value: 0.5 });    
        expect(testItem.parse('1.', 'KEY', 'en')).toEqual({ value: 1 });      
        expect(testItem.parse('1.0', 'KEY', 'en')).toEqual({ value: 1 });                
        expect(testItem.parse('1,000', 'KEY', 'en')).toEqual(errResult);
        expect(testItem.parse('$1', 'KEY', 'en')).toEqual(errResult);
        expect(testItem.parse('1%', 'KEY', 'en')).toEqual(errResult);
        expect(testItem.parse('$-1', 'KEY', 'en')).toEqual(errResult);
        expect(testItem.parse('-1%', 'KEY', 'en')).toEqual(errResult);

        expect(testItem.parse('', 'KEY', 'en')).toEqual({ value: 0 }); // default for empty
        expect(testItem.parse('  ', 'KEY', 'en')).toEqual({ value: 0 });
        // unsupported characters
        expect(testItem.parse('(1)', 'KEY', 'en')).toEqual(errResult); 
        expect(testItem.parse('A1', 'KEY', 'en')).toEqual(errResult);
        expect(testItem.parse('!', 'KEY', 'en')).toEqual(errResult);
        expect(testItem.parse('1!', 'KEY', 'en')).toEqual(errResult);
        expect(testItem.parse('!1', 'KEY', 'en')).toEqual(errResult);
        expect(testItem.parse('ABC', 'KEY', 'en')).toEqual(errResult);
        expect(testItem.parse('$1.50USD', 'KEY', 'en')).toEqual(errResult);
        expect(testItem.parse('USD $1.50', 'KEY', 'en')).toEqual(errResult);
        expect(testItem.parse('USD1.50', 'KEY', 'en')).toEqual(errResult);

        // expected characters in the wrong place
        expect(testItem.parse('1..5', 'KEY', 'en')).toEqual(errResult);
        expect(testItem.parse('.1.5', 'KEY', 'en')).toEqual(errResult);
        expect(testItem.parse('(1.5(', 'KEY', 'en')).toEqual(errResult);
        expect(testItem.parse(')1.5)', 'KEY', 'en')).toEqual(errResult);
        expect(testItem.parse('--1.5', 'KEY', 'en')).toEqual(errResult);
        expect(testItem.parse('-1.5-', 'KEY', 'en')).toEqual(errResult);
        expect(testItem.parse('1-5', 'KEY', 'en')).toEqual(errResult);
        expect(testItem.parse('1(5', 'KEY', 'en')).toEqual(errResult);
        expect(testItem.parse('1)5', 'KEY', 'en')).toEqual(errResult);
        expect(testItem.parse('1 5', 'KEY', 'en')).toEqual(errResult);

    });
    test('parse() with number allowing () and negative symbol is !', () => {
        const errResult = { errorMessage: NumberParserBase.badNumberMessage };
        let testItem = new TestNumberParserBase('KEY', ['en', 'en-US'],
        {
            decimalSeparator: '.', negativeSymbol: '!', thousandsSeparator: ',',
            parenthesisAsNegative: true,
            currencySymbol: undefined!, percentSymbol: undefined!
         });
        expect(testItem.parse('1', 'KEY', 'en')).toEqual({ value: 1 });
        expect(testItem.parse('(1)', 'KEY', 'en')).toEqual({ value: -1}); 
        expect(testItem.parse('!1', 'KEY', 'en')).toEqual({ value: -1}); 
        expect(testItem.parse('1.5', 'KEY', 'en')).toEqual({ value: 1.5 }); 
        expect(testItem.parse(' 1 ', 'KEY', 'en')).toEqual({ value: 1 });
        expect(testItem.parse('.5', 'KEY', 'en')).toEqual({ value: 0.5 });    
        expect(testItem.parse('1.', 'KEY', 'en')).toEqual({ value: 1 });      
        expect(testItem.parse('1.0', 'KEY', 'en')).toEqual({ value: 1 });                
        expect(testItem.parse('1,000', 'KEY', 'en')).toEqual({ value: 1000 });
        expect(testItem.parse('(1,000)', 'KEY', 'en')).toEqual({ value: -1000 });
       
        expect(testItem.parse('!1,000', 'KEY', 'en')).toEqual({ value: -1000 });

        // very unexpected but we're gonna strip out all thousands separators
        expect(testItem.parse(',1000', 'KEY', 'en')).toEqual({ value: 1000 });
        expect(testItem.parse('1000,', 'KEY', 'en')).toEqual({ value: 1000 });
        expect(testItem.parse(',,1,0,0,0,,', 'KEY', 'en')).toEqual({ value: 1000 });


        // wrong negative symbol
        expect(testItem.parse('-1.5', 'KEY', 'en')).toEqual(errResult);
        expect(testItem.parse('1.5-', 'KEY', 'en')).toEqual(errResult);

        // expected characters in the wrong place

        expect(testItem.parse('(1.5(', 'KEY', 'en')).toEqual(errResult);
        expect(testItem.parse(')1.5(', 'KEY', 'en')).toEqual(errResult);
        expect(testItem.parse('!!1.5', 'KEY', 'en')).toEqual(errResult);
        expect(testItem.parse('!1.5!', 'KEY', 'en')).toEqual(errResult);
        expect(testItem.parse('1!5', 'KEY', 'en')).toEqual(errResult);
        expect(testItem.parse('1()5', 'KEY', 'en')).toEqual(errResult);
        expect(testItem.parse('1)5', 'KEY', 'en')).toEqual(errResult);
        expect(testItem.parse('(1', 'KEY', 'en')).toEqual(errResult);
        expect(testItem.parse('1)', 'KEY', 'en')).toEqual(errResult);

         // must have at least one digit
        expect(testItem.parse(',', 'KEY', 'en')).toEqual(errResult);  
        expect(testItem.parse('ABC', 'KEY', 'en')).toEqual(errResult);  

        // must not have letters
        expect(testItem.parse('A1', 'KEY', 'en')).toEqual(errResult);  
        expect(testItem.parse('1000 A', 'KEY', 'en')).toEqual(errResult);  


    });    
    test('parse() with stripTheseStrings containing an array', () => {
        const errResult = { errorMessage: NumberParserBase.badNumberMessage };

        let testItem = new TestNumberParserBase('KEY', ['en', 'en-US'],
        {
            decimalSeparator: '.', negativeSymbol: '-', thousandsSeparator: ',',
            parenthesisAsNegative: true,
            currencySymbol: '$', percentSymbol: '%' // these are ignored, the stripTheseStrings parameter is used instead
            }, ['%', '$']);
        
        expect(testItem.parse('1', 'KEY', 'en')).toEqual({ value: 1 });
        expect(testItem.parse('1.', 'KEY', 'en')).toEqual({ value: 1 });
        expect(testItem.parse('-1', 'KEY', 'en')).toEqual({ value: -1 });
        expect(testItem.parse('- 1', 'KEY', 'en')).toEqual({ value: -1 });
        expect(testItem.parse('$1', 'KEY', 'en')).toEqual({ value: 1 });
        expect(testItem.parse('$-1', 'KEY', 'en')).toEqual({ value: -1 });
        expect(testItem.parse('$ -1', 'KEY', 'en')).toEqual({ value: -1 });
        expect(testItem.parse('1%', 'KEY', 'en' )).toEqual({ value: 1 });
        expect(testItem.parse('-1%', 'KEY', 'en' )).toEqual({ value: -1 }); 
        expect(testItem.parse('$ 1', 'KEY', 'en' )).toEqual({ value: 1 });
        expect(testItem.parse('1 %', 'KEY', 'en' )).toEqual({ value: 1 });
        expect(testItem.parse('1,000', 'KEY', 'en' )).toEqual({ value: 1000 });
        expect(testItem.parse('1,000,388', 'KEY', 'en' )).toEqual({ value: 1000388 });
        expect(testItem.parse('1.5', 'KEY', 'en' )).toEqual({ value: 1.5 });
        expect(testItem.parse(' 1 ', 'KEY', 'en')).toEqual({ value: 1 });

        expect(testItem.parse('(1)', 'KEY', 'en')).toEqual({ value: -1 });    

        expect(testItem.parse(' 1.5 ', 'KEY', 'en')).toEqual({ value: 1.5 });
        expect(testItem.parse('1.1', 'KEY', 'en')).toEqual({ value: 1.1 });
        expect(testItem.parse('-1.0', 'KEY', 'en')).toEqual({ value: -1 });
        expect(testItem.parse('- 1.6', 'KEY', 'en')).toEqual({ value: -1.6 });
        expect(testItem.parse('$1.0', 'KEY', 'en')).toEqual({ value: 1 });
        expect(testItem.parse('$-1.99', 'KEY', 'en')).toEqual({ value: -1.99 });
        expect(testItem.parse('$ -1.103', 'KEY', 'en')).toEqual({ value: -1.103 });
        expect(testItem.parse('1.9%', 'KEY', 'en')).toEqual({ value: 1.9 });
        expect(testItem.parse('-1.0%', 'KEY', 'en')).toEqual({ value: -1 }); 
        expect(testItem.parse('$ 1.00', 'KEY', 'en')).toEqual({ value: 1 });
        expect(testItem.parse('1.1 %', 'KEY', 'en' )).toEqual({ value: 1.1 });
        expect(testItem.parse('1,000.99', 'KEY', 'en' )).toEqual({ value: 1000.99 });

 
        expect(testItem.parse('1..5', 'KEY', 'en')).toEqual(errResult);
        expect(testItem.parse('.1.5', 'KEY', 'en')).toEqual(errResult);
        expect(testItem.parse('-1-', 'KEY', 'en')).toEqual(errResult);   
        
         // must have at least one digit
         expect(testItem.parse(',', 'KEY', 'en')).toEqual(errResult);  
         expect(testItem.parse('ABC', 'KEY', 'en')).toEqual(errResult);  
 
         // must not have letters
         expect(testItem.parse('A1%', 'KEY', 'en')).toEqual(errResult);  
         expect(testItem.parse('1000 USD', 'KEY', 'en')).toEqual(errResult);  
         expect(testItem.parse('$1000 USD', 'KEY', 'en')).toEqual(errResult);  
 
 
    });    
    test('parse() with stripTheseStrings containing a string', () => {
        let testItem = new TestNumberParserBase('KEY', ['en', 'en-US'],
        {
            decimalSeparator: '.', negativeSymbol: '-', thousandsSeparator: ',',
            parenthesisAsNegative: true,
            currencySymbol: '$', percentSymbol: '%' // these are ignored, the stripTheseStrings parameter is used instead
            }, '%');
        
        expect(testItem.parse('1', 'KEY', 'en')).toEqual({ value: 1 });
        expect(testItem.parse('1%', 'KEY', 'en' )).toEqual({ value: 1 });
        expect(testItem.parse('-1%', 'KEY', 'en' )).toEqual({ value: -1 }); 
        expect(testItem.parse('1 %', 'KEY', 'en' )).toEqual({ value: 1 });

        expect(testItem.parse('1.9%', 'KEY', 'en')).toEqual({ value: 1.9 });
        expect(testItem.parse('-1.0%', 'KEY', 'en')).toEqual({ value: -1 }); 
    });        
    test('parse() with number with decimalSeparator is !', () => {
        const errResult = { errorMessage: NumberParserBase.badNumberMessage };
        let testItem = new TestNumberParserBase('KEY', ['en', 'en-US'],
            {
                decimalSeparator: '!', negativeSymbol: '-', thousandsSeparator: ',',
                parenthesisAsNegative: true,
                currencySymbol: undefined!, percentSymbol: undefined!
            });
        expect(testItem.parse('1', 'KEY', 'en')).toEqual({ value: 1 });
        expect(testItem.parse('1!0', 'KEY', 'en')).toEqual({ value: 1 });
        expect(testItem.parse('10!3', 'KEY', 'en')).toEqual({ value: 10.3 });
        expect(testItem.parse('-1', 'KEY', 'en')).toEqual({ value: -1 });
        expect(testItem.parse('-1!0', 'KEY', 'en')).toEqual({ value: -1 });
        expect(testItem.parse('-10!3', 'KEY', 'en')).toEqual({ value: -10.3 });
        expect(testItem.parse('1.1', 'KEY', 'en')).toEqual(errResult);
    });
    test('parse() with number with thousandsSeparator is _', () => {
        const errResult = { errorMessage: NumberParserBase.badNumberMessage };
        let testItem = new TestNumberParserBase('KEY', ['en', 'en-US'],
            {
                decimalSeparator: '.', negativeSymbol: '-', thousandsSeparator: '_',
                parenthesisAsNegative: undefined,
                currencySymbol: undefined!, percentSymbol: undefined!
            });
        expect(testItem.parse('1', 'KEY', 'en')).toEqual({ value: 1 });
        expect(testItem.parse('100', 'KEY', 'en')).toEqual({ value: 100 });
        expect(testItem.parse('1003', 'KEY', 'en')).toEqual({ value: 1003 });
        expect(testItem.parse('1_003', 'KEY', 'en')).toEqual({ value: 1003 });
        expect(testItem.parse('99999_003', 'KEY', 'en')).toEqual({ value: 99999003 });
        expect(testItem.parse('-99_999_003', 'KEY', 'en')).toEqual({ value: -99999003 });
        expect(testItem.parse('99999__003', 'KEY', 'en')).toEqual({ value: 99999003 });
        expect(testItem.parse('_', 'KEY', 'en')).toEqual(errResult); 
        expect(testItem.parse('1,100', 'KEY', 'en')).toEqual(errResult);
    });    
});

describe('NumberParser', () => {
    // this is a direct subclass of NumberParserBase, already tested.
    // its special case is that supportedLookupKey = LookupKey.Number
    // tests involve the constructor setting it up correctly
    test('constructor with valid parameters assigns supportedLookupKey=Number', () => {
        let testItem = new NumberParser(['en'], { decimalSeparator: '.', negativeSymbol: '-'});    // thousands defaults to null; allowNegatives defaults to true
        expect(testItem.supportedLookupKey).toBe(LookupKey.Number);
        expect(testItem.supportedCultures).toEqual(['en']);
    });
    test('constructor with entire NumberCultureInfo properties assigns supportedLookupKey=Number', () => {
        let testItem = new NumberParser(['en'], 
        {
            decimalSeparator: '.', negativeSymbol: '-', thousandsSeparator: ',',
            currencySymbol: '$', percentSymbol: '%' // these are ignored, the stripTheseStrings parameter is used instead
        } as NumberCultureInfo);
        
        expect(testItem.supportedLookupKey).toBe(LookupKey.Number);
        expect(testItem.supportedCultures).toEqual(['en']);
    });
});

describe('CurrencyParser', () => {
    // this is a direct subclass of NumberParserBase, already tested.
    // its special case is that supportedLookupKey = LookupKey.Currency
    // tests involve the constructor setting it up correctly
    test('constructor with valid parameters assigns supportedLookupKey=Currency', () => {
        let testItem = new CurrencyParser(['en'],
        {
            decimalSeparator: '.', negativeSymbol: '-', thousandsSeparator: ',',
            currencySymbol: '$' 
        });
        expect(testItem.supportedLookupKey).toBe(LookupKey.Currency);
        expect(testItem.supportedCultures).toEqual(['en']);
    });

});
describe('PercentageParser', () => {
    // this is a direct subclass of NumberParserBase, already tested.
    // its special case is that supportedLookupKey = LookupKey.Percentage
    // tests involve the constructor setting it up correctly
    // Parsing also is impacted, as every value is divided by 100.
    test('constructor with valid parameters assigns supportedLookupKey=Percentage', () => {
        let testItem = new PercentageParser(['en'], 
        {
            decimalSeparator: '.', negativeSymbol: '-', thousandsSeparator: ',',
            percentSymbol: '%'
         });
        expect(testItem.supportedLookupKey).toBe(LookupKey.Percentage);
        expect(testItem.supportedCultures).toEqual(['en']);
    });
    test('constructor with percentSymbol null throws', () => {
        expect(() => new PercentageParser(['en'], {
            decimalSeparator: '.', negativeSymbol: '-', thousandsSeparator: ',',
            percentSymbol: null!
        })).toThrow(/percentSymbol/);
    });

    test('constructor with percentSymbol="" throws', () => {
        expect(() => new PercentageParser(['en'], {
            decimalSeparator: '.', negativeSymbol: '-', thousandsSeparator: ',',
            percentSymbol: ''
        })).toThrow(/percentSymbol option required/);
    });
    test('parse() returns the input value divided by 100', () => {
        let testItem = new PercentageParser(['en'],
        {
            decimalSeparator: '.', negativeSymbol: '-', thousandsSeparator: ',',
            percentSymbol: '%'
        });
        expect(testItem.parse('1', LookupKey.Percentage, 'en')).toEqual({ value: 0.01 });
        expect(testItem.parse('100', LookupKey.Percentage, 'en')).toEqual({ value: 1 });
        expect(testItem.parse('X', LookupKey.Percentage, 'en')).toEqual({ errorMessage: NumberParserBase.badNumberMessage });
    });
});

describe('Percentage100Parser', () => {
    // this is a direct subclass of NumberParserBase, already tested.
    // its special case is that supportedLookupKey = LookupKey.Percentage100
    // tests involve the constructor setting it up correctly
    // Parsing also is impacted, as every value is divided by 100.
    test('constructor with valid parameters assigns supportedLookupKey=Percentage100', () => {
        let testItem = new Percentage100Parser(['en'], 
        {
            decimalSeparator: '.', negativeSymbol: '-', thousandsSeparator: ',',
            percentSymbol: '%' 
        });
        expect(testItem.supportedLookupKey).toBe(LookupKey.Percentage100);
        expect(testItem.supportedCultures).toEqual(['en']);
    });
    test('constructor with percentSymbol null throws', () => {
        expect(() => new Percentage100Parser(['en'], {
            decimalSeparator: '.', negativeSymbol: '-', thousandsSeparator: ',',
            percentSymbol: null!
        })).toThrow(/percentSymbol/);
    });

    test('constructor with percentSymbol="" throws', () => {
        expect(() => new Percentage100Parser(['en'], {
            decimalSeparator: '.', negativeSymbol: '-', thousandsSeparator: ',',
            percentSymbol: ''
        })).toThrow(/percentSymbol option required/);
    });
    test('parse() returns the input value without modification', () => {
        let testItem = new Percentage100Parser(['en'], 
        {
            decimalSeparator: '.', negativeSymbol: '-', thousandsSeparator: ',',
            percentSymbol: '%'
         });
        expect(testItem.parse('1', LookupKey.Percentage, 'en')).toEqual({ value: 1 });
        expect(testItem.parse('100', LookupKey.Percentage, 'en')).toEqual({ value: 100 });
        expect(testItem.parse('X', LookupKey.Percentage, 'en')).toEqual({ errorMessage: NumberParserBase.badNumberMessage });
    });
});
describe('BooleanParser', () => {

    test('constructor trueValues=YES|TRUE, falseValues=NO|FALSE|(emptystring)', () => {
        let testItem = new BooleanParser(['en'], { trueValues: ['YES', 'TRUE'], falseValues: ['NO', 'FALSE', ''] });
        expect(testItem.supportedLookupKey).toBe(LookupKey.Boolean);
        expect(testItem.supportedCultures).toEqual(['en']);
    });
    test('constructor trueValues=null throws', () => {
        expect(()=> new BooleanParser(['en'], { trueValues: null!, falseValues: ['NO', 'FALSE', ''] })).toThrow(/trueValues/);
    });
    test('constructor trueValues=[]] throws', () => {
        expect(()=> new BooleanParser(['en'], { trueValues: [], falseValues: ['NO', 'FALSE', ''] })).toThrow(/trueValue/);
    });
    test('constructor falseValues=null throws', () => {
        expect(()=> new BooleanParser(['en'], { falseValues: null!, trueValues: ['YES', 'TRUE'] })).toThrow(/falseValues/);
    });
    test('constructor falseValues=[]] throws', () => {
        expect(()=> new BooleanParser(['en'], { falseValues: [], trueValues: ['YES', 'TRUE'] })).toThrow(/falseValue/);
    });    
    test('constructor supportedCultures=[] throws', () => {
        expect(()=> new BooleanParser([], { falseValues: ['NO'], trueValues: ['YES', 'TRUE'] })).toThrow(/Missing supportedCultures/);
    });    
    test('constructor supportedCultures=null throws', () => {
        expect(()=> new BooleanParser(null!, { falseValues: ['NO'], trueValues: ['YES', 'TRUE'] })).toThrow(/supportedCultures/);
    });            
    test('supports() returns true for matching lookupkey + culture', () => {
        let testItem = new BooleanParser(['en', 'de'], { trueValues: ['YES', 'TRUE'], falseValues: ['NO', 'FALSE', ''] });
        expect(testItem.supports(LookupKey.Boolean, 'en', 'YES')).toBe(true);
        expect(testItem.supports(LookupKey.Boolean, 'de', 'YES')).toBe(true);
        expect(testItem.supports(LookupKey.Boolean, 'fr', 'YES')).toBe(false);
        expect(testItem.supports('WRONGKEY', 'en', 'YES')).toBe(false);
    });

    test('parse() returns true, false or error message depending on the input', () => {
        let testItem = new BooleanParser(['en'], { trueValues: ['YES', 'TRUE'], falseValues: ['NO', 'FALSE', ''] });
        expect(testItem.parse('YES', LookupKey.Boolean, 'en')).toEqual({ value: true });
        expect(testItem.parse('TRUE', LookupKey.Boolean, 'en')).toEqual({ value: true });
        expect(testItem.parse('NO', LookupKey.Boolean, 'en')).toEqual({ value: false });
        expect(testItem.parse('FALSE', LookupKey.Boolean, 'en')).toEqual({ value: false });
        expect(testItem.parse('', LookupKey.Boolean, 'en')).toEqual({ value: false });
        expect(testItem.parse('yes', LookupKey.Boolean, 'en')).toEqual({ value: true });
        expect(testItem.parse('Yes', LookupKey.Boolean, 'en')).toEqual({ value: true });
        expect(testItem.parse('X', LookupKey.Boolean, 'en')).toEqual({ errorMessage: BooleanParserBase.badTextMessage });
    });
});

describe('EmptyStringIsFalseParser', () => {

    test('constructor initializes supportedLookupKey', () => {
        let testItem = new EmptyStringIsFalseParser('KEY');
        expect(testItem.supportedLookupKey).toBe('KEY');
    });
    test('supports is true when matching supported lookupkey', () => {
        let testItem = new EmptyStringIsFalseParser('KEY');
        expect(testItem.supports('KEY', 'does not matter', 'does not matter')).toBe(true);
        expect(testItem.supports('WRONGKEY', 'does not matter', 'does not matter')).toBe(false);        
    });
    test('parse() returns true, false or error message depending on the input', () => {
        let testItem = new EmptyStringIsFalseParser('KEY');
        expect(testItem.parse('', 'KEY', 'en')).toEqual({ value: false });
        expect(testItem.parse('   ', 'KEY', 'en')).toEqual({ value: false });        
        expect(testItem.parse('YES', 'KEY', 'en')).toEqual({ value: true });
        expect(testItem.parse('  YES   ', 'KEY', 'en')).toEqual({ value: true });
        expect(testItem.parse('TRUE', 'KEY', 'en')).toEqual({ value: true });
        expect(testItem.parse('NO', 'KEY', 'en')).toEqual({ value: true });
        expect(testItem.parse('FALSE', 'KEY', 'en')).toEqual({ value: true });

    });
});
