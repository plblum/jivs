import { IValidationServices } from '@plblum/jivs-engine/build/Interfaces/ValidationServices';
import { LookupKey } from "@plblum/jivs-engine/build/DataTypes/LookupKeys";
import { EnumByNumberFormatter, EnumByNumberParser, EnumByNumberParserOptions, PhoneType, PhoneTypeLookupKey, phoneTypeEnumValues } from '../src/EnumByNumberDataTypes';
import { createMinimalValidationServices } from "../src/support";
import { TextLocalizerService } from "@plblum/jivs-engine/build/Services/TextLocalizerService";

function addLocalizedTextForCulture(services: IValidationServices): void
{
    // let cis = services.cultureService;
    // cis.register({ cultureId: 'en-US', fallbackCultureId: 'en' });

    let tls = services.textLocalizerService as TextLocalizerService;
    
    tls.register(phoneTypeEnumValues[0].textl10n!, {
        '*': '0_*',
        'en': '0_en',
        'fr': '0_fr',
        'de': '0_de',
    });
    tls.register(phoneTypeEnumValues[1].textl10n!, {
        '*': '1_*',
        'en': '1_en',
        'fr': '1_fr',
// omitted to use fallback           'de': '1_de',
    });
    tls.register(phoneTypeEnumValues[2].textl10n!, {
        '*': '2_*',
        'en': '2_en',
// omitted to use non-localized text            'fr': '2_fr',
        'de': '2_de',
    });
    tls.register(phoneTypeEnumValues[3].textl10n!, {
        '*': '10_*',
        'en': '10_en',
        'fr': '10_fr',
        'de': '10_de',
    });        
}
describe('EnumByNumberParser using PhoneType enum', () => {
    function testParseMatches(text: string, expectedValue: any, options: EnumByNumberParserOptions = {}): void
    {
        let testItem = new EnumByNumberParser(PhoneTypeLookupKey, phoneTypeEnumValues, options);
        testItem.services = createMinimalValidationServices('en');
        
        let dts = testItem.parse(text, PhoneTypeLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe(expectedValue);
        expect(dts.errorMessage).toBeUndefined();
    }
    function testParseInvalid(text: string, options: EnumByNumberParserOptions = {}): void
    {
        let testItem = new EnumByNumberParser(PhoneTypeLookupKey, phoneTypeEnumValues, options);
        testItem.services = createMinimalValidationServices('en');
        
        let dts = testItem.parse(text, PhoneTypeLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).not.toBeUndefined();
    }    

    test('supports', () => {
        let testItem = new EnumByNumberParser(PhoneTypeLookupKey, phoneTypeEnumValues, {});
        expect(testItem.supports(PhoneTypeLookupKey, 'en', 'anything')).toBe(true);
        expect(testItem.supports(PhoneTypeLookupKey, 'fr', 'anything')).toBe(true);    
        expect(testItem.supports(LookupKey.Number, 'en', 'anything')).toBe(false);   
        expect(testItem.supports(LookupKey.Uppercase, 'en', 'anything')).toBe(false);        
    });
    test('parse with exact text matches returns correct numbers', () => {
        testParseMatches(PhoneType[PhoneType.Landline], PhoneType.Landline);
        testParseMatches(PhoneType[PhoneType.Mobile], PhoneType.Mobile);
        testParseMatches(PhoneType[PhoneType.Fax], PhoneType.Fax);
        testParseMatches(PhoneType[PhoneType.Other], PhoneType.Other);
        testParseMatches(' ' + PhoneType[PhoneType.Other] + ' ', PhoneType.Other);        
    });
    test('parse with text that does not match returns error message', () => {
        testParseInvalid('L');
        testParseInvalid(PhoneType[PhoneType.Landline].toLowerCase());
    });    
    
    test('parse with lead and trailing whitespace', () => {
        testParseMatches(' ' + PhoneType[PhoneType.Other], PhoneType.Other);        
        testParseMatches(PhoneType[PhoneType.Other] + ' ', PhoneType.Other);        
        testParseMatches(' ' + PhoneType[PhoneType.Other] + ' ', PhoneType.Other);        
    });    
    test('parse with caseInsensitive', () => {
        testParseMatches(PhoneType[PhoneType.Landline].toUpperCase(), PhoneType.Landline, { caseInsensitive: true });
        testParseMatches(PhoneType[PhoneType.Landline], PhoneType.Landline, { caseInsensitive: true });
        testParseMatches(PhoneType[PhoneType.Mobile], PhoneType.Mobile, { caseInsensitive: true });
        testParseMatches(PhoneType[PhoneType.Fax], PhoneType.Fax, { caseInsensitive: true });
        testParseMatches(PhoneType[PhoneType.Other], PhoneType.Other, { caseInsensitive: true });
        testParseMatches(' ' + PhoneType[PhoneType.Other] + ' ', PhoneType.Other, { caseInsensitive: true });
        testParseMatches(PhoneType[PhoneType.Landline].toUpperCase(), PhoneType.Landline, { caseInsensitive: true });
        testParseInvalid(PhoneType[PhoneType.Landline] + 'A', { caseInsensitive: true });        
        testParseInvalid(PhoneType[PhoneType.Landline].toUpperCase() + 'A', { caseInsensitive: true });
    });

    test('parse with empty string returns a value of the empty string', () => {
        testParseMatches('', null, { });
        testParseMatches('  ', null, {});
        testParseMatches('', 0, { emptyStringResult: 0 });        
        testParseMatches('', 0, { trim: false, emptyStringResult: 0  });
        testParseInvalid('  ', { trim: false, emptyStringResult: 0 });
        testParseMatches('', null, { emptyStringResult: null});
        testParseMatches('', PhoneType.Fax, { emptyStringResult: PhoneType.Fax });
    });

    function testParseLocalized(text: string, cultureId: string, expectedValue: any, options: EnumByNumberParserOptions = {}): void
    {
        let testItem = new EnumByNumberParser(PhoneTypeLookupKey, phoneTypeEnumValues, {});
        testItem.services = createMinimalValidationServices('en');
        addLocalizedTextForCulture(testItem.services);
        
        let dts = testItem.parse(text, PhoneTypeLookupKey, cultureId);
        expect(dts).not.toBeNull();
        expect(dts.value).toBe(expectedValue);
        expect(dts.errorMessage).toBeUndefined();
    }        
    test('parse with with localized text for multiple cultures returns correct values', () => {
        testParseLocalized('0_*', 'en', PhoneType.Landline);               
        testParseLocalized('0_de', 'de', PhoneType.Landline);        
        testParseLocalized('0_en', 'en', PhoneType.Landline);
        testParseLocalized('0_fr', 'fr', PhoneType.Landline);
        testParseLocalized(PhoneType[PhoneType.Landline], 'any', PhoneType.Landline);             
    });
    test('parse with numbers as text', () => {
        testParseMatches(PhoneType.Landline.toString(), PhoneType.Landline, { supportNumbers: true });
        testParseMatches(PhoneType.Mobile.toString(), PhoneType.Mobile, { supportNumbers: true });
        testParseMatches(PhoneType.Fax.toString(), PhoneType.Fax, { supportNumbers: true });
        testParseMatches(PhoneType.Other.toString(), PhoneType.Other, { supportNumbers: true });     
        testParseMatches(' ' + PhoneType.Other.toString() + ' ', PhoneType.Other, { supportNumbers: true });         
        
        testParseInvalid(' ' + PhoneType.Landline.toString() + ' ', { supportNumbers: true, trim: false });
        testParseInvalid('100', { supportNumbers: true });
   
    });
    test('parse with numbers option but supplying text', () => {
        testParseMatches(PhoneType[PhoneType.Landline], PhoneType.Landline, { supportNumbers: true });
        testParseMatches(PhoneType[PhoneType.Mobile], PhoneType.Mobile, { supportNumbers: true });
        testParseMatches(PhoneType[PhoneType.Fax], PhoneType.Fax, { supportNumbers: true });
        testParseMatches(PhoneType[PhoneType.Other], PhoneType.Other, { supportNumbers: true });             
    });

});

describe('EnumByNumberFormatter using PhoneType enum', () => {
    function testFormatMatches(value: number, expectedText: string): void
    {
        let testItem = new EnumByNumberFormatter(PhoneTypeLookupKey, phoneTypeEnumValues);
        testItem.services = createMinimalValidationServices('en');
        
        let dts = testItem.format(value, PhoneTypeLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBe(expectedText);
        expect(dts.errorMessage).toBeUndefined();
    }
    function testFormatInvalid(value: number): void
    {
        let testItem = new EnumByNumberFormatter(PhoneTypeLookupKey, phoneTypeEnumValues);
        testItem.services = createMinimalValidationServices('en');
        
        let dts = testItem.format(value, PhoneTypeLookupKey, 'en');
        expect(dts).not.toBeNull();
        expect(dts.value).toBeUndefined();
        expect(dts.errorMessage).not.toBeUndefined();
    }    

    test('supports', () => {
        let testItem = new EnumByNumberFormatter(PhoneTypeLookupKey, phoneTypeEnumValues);
        expect(testItem.supports(PhoneTypeLookupKey, 'en')).toBe(true);
        expect(testItem.supports(PhoneTypeLookupKey, 'fr')).toBe(true);    
        expect(testItem.supports(LookupKey.Number, 'en')).toBe(false);   
        expect(testItem.supports(LookupKey.Uppercase, 'en')).toBe(false);        
    });
    test('format with valid numbers returns the enumValueInfo.text value', () => {
        testFormatMatches(PhoneType.Landline, PhoneType[PhoneType.Landline]);
        testFormatMatches(PhoneType.Mobile, PhoneType[PhoneType.Mobile]);
        testFormatMatches(PhoneType.Fax, PhoneType[PhoneType.Fax]);
        testFormatMatches(PhoneType.Other, PhoneType[PhoneType.Other]);    
    });
    test('format with an unknown number returns error message', () => {
        testFormatInvalid(100);
    });    
    
    test('format with null returns a value of the empty string', () => {
        testFormatMatches(null!, '');
    });


    function testFormatLocalized(value: number, cultureId: string, expectedValue: any): void
    {
        let testItem = new EnumByNumberFormatter(PhoneTypeLookupKey, phoneTypeEnumValues);
        testItem.services = createMinimalValidationServices('en');
        addLocalizedTextForCulture(testItem.services);
        
        let dts = testItem.format(value, PhoneTypeLookupKey, cultureId);
        expect(dts).not.toBeNull();
        expect(dts.value).toBe(expectedValue);
        expect(dts.errorMessage).toBeUndefined();
    }        
    test('format with with localized text for multiple cultures returns correct values', () => {
        testFormatLocalized(PhoneType.Landline, 'en', '0_en');
        testFormatLocalized(PhoneType.Landline, 'fr', '0_fr');
        testFormatLocalized(PhoneType.Landline, 'de', '0_de');        
        testFormatLocalized(PhoneType.Landline, 'any', '0_*');           
        testFormatLocalized(PhoneType.Fax, 'fr', '2_*');        
    });

});
