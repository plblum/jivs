import { AnniversaryLookupKey, AnniversaryConverter } from '../src/AnniversaryDataType';
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import { ComparersResult } from '@plblum/jivs-engine/build/Interfaces/DataTypeComparerService';
import { DataTypeComparerService } from '@plblum/jivs-engine/build/Services/DataTypeComparerService';
import { DataTypeConverterService } from '@plblum/jivs-engine/build/Services/DataTypeConverterService';
import { createMinimalJivsServices } from '../src/support';
import { DataTypeParserBase } from '@plblum/jivs-engine/build/DataTypes/DataTypeParserBase';
import {
    AnniversaryParser, AnniversaryParserOptions, invalidDayErrorCode, invalidDayErrorMessage,
    invalidMonthErrorCode, invalidMonthErrorMessage
} from '../src/AnniversaryDataType';

describe('AnniversaryConverter', () => {
    test('canConvert', () => {
        let testItem = new AnniversaryConverter();
        expect(testItem.canConvert(new Date(), AnniversaryLookupKey, LookupKey.Number)).toBe(true);
        expect(testItem.canConvert(new Date(), AnniversaryLookupKey, LookupKey.String)).toBe(false);
        expect(testItem.canConvert(new Date(), null, LookupKey.Number)).toBe(false); // always requires AnniversaryLookupKey            
        expect(testItem.canConvert(0, AnniversaryLookupKey, LookupKey.Number)).toBe(false);
        expect(testItem.canConvert(null, AnniversaryLookupKey, LookupKey.Number)).toBe(false);
    })
    test('convert', () => {
        let testItem = new AnniversaryConverter();
        // convert expects to be called after canConvert is true.
        // So no illegal values as parameters tested
        // Reminder that the year used in this Converter is 2004
        let test1 = new Date(Date.UTC(2000, 10, 5));
        let test1Anniversary = new Date(Date.UTC(2004, 10, 5));
        let test2 = new Date(Date.UTC(2023, 0, 2, 4, 30));
        let test2Anniversary = new Date(Date.UTC(2004, 0, 2));
        expect(testItem.convert(test1, AnniversaryLookupKey, LookupKey.Number)).toBe(test1Anniversary.getTime());
        expect(testItem.convert(test2, AnniversaryLookupKey, LookupKey.Number)).toBe(test2Anniversary.getTime());
        // dates with an illegal value will convert to undefined
        let illegalDate = new Date('foo');
        expect(testItem.convert(illegalDate, AnniversaryLookupKey, LookupKey.Number)).toBeUndefined();
    });
});

function createAnniversaryParser(
    order: 'md' | 'dm' = 'md',
    separator: string = '/',
    year?: number
): AnniversaryParser
{
    const options: AnniversaryParserOptions<Date> = { order, separator };
    if (year !== undefined)
        options.year = year;
    return new AnniversaryParser(AnniversaryLookupKey, ['en-US'], options);
}

    // Verify supported month/day formats become UTC dates with the configured or default leap year.
describe('AnniversaryParser valid input', () =>
{
    test('parses month-first input using the default leap year', () =>
    {
        const parser = createAnniversaryParser();

        expect(parser.parse('11/5', AnniversaryLookupKey, 'en-US')).toEqual({
            value: new Date(Date.UTC(2004, 10, 5))
        });
    });

    test('parses day-first input and uses the configured year', () =>
    {
        const parser = createAnniversaryParser('dm', '-', 2025);

        expect(parser.parse('5-11', AnniversaryLookupKey, 'en-US')).toEqual({
            value: new Date(Date.UTC(2025, 10, 5))
        });
    });

    test('supports leap day in the default leap year', () =>
    {
        const parser = createAnniversaryParser();

        expect(parser.parse('2/29', AnniversaryLookupKey, 'en-US')).toEqual({
            value: new Date(Date.UTC(2004, 1, 29))
        });
    });

    test('escapes a regular-expression separator and accepts surrounding whitespace', () =>
    {
        const parser = createAnniversaryParser('md', '.');

        expect(parser.parse('  3.9  ', AnniversaryLookupKey, 'en-US')).toEqual({
            value: new Date(Date.UTC(2004, 2, 9))
        });
        expect(parser.parse('3x9', AnniversaryLookupKey, 'en-US').errorDetails)
            .toMatchObject({
                errorMessage: AnniversaryParser.badAnniversaryMessage,
                errorCode: DataTypeParserBase.ParserErrorCode
            });
    });

    test('returns null for empty or whitespace-only input', () =>
    {
        const parser = createAnniversaryParser();

        expect(parser.parse('', AnniversaryLookupKey, 'en-US')).toEqual({ value: null });
        expect(parser.parse(' \t ', AnniversaryLookupKey, 'en-US')).toEqual({ value: null });
    });
});

// Verify invalid month/day components and malformed input return stable parser errors.
describe('AnniversaryParser invalid input', () =>
{
    test.each(['0/5', '13/5'])('rejects invalid month input %s', (text) =>
    {
        const parser = createAnniversaryParser();

        expect(parser.parse(text, AnniversaryLookupKey, 'en-US')).toEqual({
            errorDetails: {
                errorMessage: invalidMonthErrorMessage,
                errorMessagel10n: `${ invalidMonthErrorCode }_${ AnniversaryLookupKey }_l10n`,
                errorCode: invalidMonthErrorCode
            }
        });
    });

    test.each(['5/0', '5/32'])('rejects invalid day input %s', (text) =>
    {
        const parser = createAnniversaryParser();

        expect(parser.parse(text, AnniversaryLookupKey, 'en-US')).toEqual({
            errorDetails: {
                errorMessage: invalidDayErrorMessage,
                errorMessagel10n: `${ invalidDayErrorCode }_${ AnniversaryLookupKey }_l10n`,
                errorCode: invalidDayErrorCode
            }
        });
    });

    test('returns a parser error when the configured year cannot produce a valid Date', () =>
    {
        const parser = createAnniversaryParser('md', '/', 1_000_000_000_000);

        expect(parser.parse('5/11', AnniversaryLookupKey, 'en-US').errorDetails)
            .toMatchObject({
                errorMessage: AnniversaryParser.badAnniversaryMessage,
                errorMessagel10n: `${ DataTypeParserBase.ParserErrorCode }_${ AnniversaryLookupKey }_l10n`,
                errorCode: DataTypeParserBase.ParserErrorCode
            });
    });

    test.each(['5', '5/2026', 'month/5'])('rejects malformed month/day input %s', (text) =>
    {
        const parser = createAnniversaryParser();

        expect(parser.parse(text, AnniversaryLookupKey, 'en-US')).toEqual({
            errorDetails: {
                errorMessage: AnniversaryParser.badAnniversaryMessage,
                errorMessagel10n: `${ DataTypeParserBase.ParserErrorCode }_${ AnniversaryLookupKey }_l10n`,
                errorCode: DataTypeParserBase.ParserErrorCode
            }
        });
    });
});

// Verify parser selection is restricted to its lookup key, supported culture, and recognized input.
describe('AnniversaryParser supports', () =>
{
    test('accepts supported month/day input and empty text only for its configured key and culture', () =>
    {
        const parser = createAnniversaryParser();

        expect(parser.supports(AnniversaryLookupKey, 'en-US', '11/5')).toBe(true);
        expect(parser.supports(AnniversaryLookupKey, 'en-US', '')).toBe(true);
        expect(parser.supports(AnniversaryLookupKey, 'en-US', 'not a date')).toBe(false);
        expect(parser.supports('Other', 'en-US', '11/5')).toBe(false);
        expect(parser.supports(AnniversaryLookupKey, 'fr-FR', '11/5')).toBe(false);
    });
});

// Verify parser construction rejects configurations that cannot define a reliable input pattern.
describe('AnniversaryParser configuration', () =>
{
    test('requires an ordering for the month and day components', () =>
    {
        const options = { separator: '/' } as AnniversaryParserOptions<Date>;

        expect(() => new AnniversaryParser(AnniversaryLookupKey, ['en-US'], options))
            .toThrow('The "order" option must be specified.');
    });

    test('requires a non-empty separator', () =>
    {
        expect(() => new AnniversaryParser(AnniversaryLookupKey, ['en-US'], {
            order: 'md',
            separator: ''
        })).toThrow('separator option required.');
    });
});

// Verify the converter integrates with date comparison while ignoring the source year.
describe('AnniversaryConverter integration', () =>
{
    test('Within dataTypeConverterService', () => {
        let date1 = new Date(Date.UTC(2000, 10, 1));
        let date2 = new Date(Date.UTC(2001, 10, 1, 2, 3, 4));
        let date3 = new Date(Date.UTC(2030, 9, 1));
        let date5 = new Date(Date.UTC(1999, 10, 2));
        let date6 = new Date(Date.UTC(2005, 8, 1, 1, 0, 0));
        let date7 = new Date(Date.UTC(1981, 10, 30, 23, 59, 59));
        let date8 = new Date(Date.UTC(1976, 10, 1));

        let vs = createMinimalJivsServices('en');
        let dtcs = vs.dataTypeConverterService as DataTypeConverterService;    
        dtcs.register(new AnniversaryConverter());
        let compareService = vs.dataTypeComparerService as DataTypeComparerService;
        expect(compareService.compare(date1, date1, AnniversaryLookupKey, AnniversaryLookupKey)).toBe(ComparersResult.Equal);
        expect(compareService.compare(date1, date2, AnniversaryLookupKey, AnniversaryLookupKey)).toBe(ComparersResult.Equal);
        expect(compareService.compare(date3, date1, AnniversaryLookupKey, AnniversaryLookupKey)).toBe(ComparersResult.LessThan);
        expect(compareService.compare(date8, date1, AnniversaryLookupKey, AnniversaryLookupKey)).toBe(ComparersResult.Equal);
        expect(compareService.compare(date5, date8, AnniversaryLookupKey, AnniversaryLookupKey)).toBe(ComparersResult.GreaterThan); 
        expect(compareService.compare(date1, date3, AnniversaryLookupKey, AnniversaryLookupKey)).toBe(ComparersResult.GreaterThan);            
        expect(compareService.compare(date7, date8, AnniversaryLookupKey, AnniversaryLookupKey)).toBe(ComparersResult.GreaterThan);            
        // these are due to the DataTypeComparerService.compare function itself
        expect(compareService.compare(null, null, AnniversaryLookupKey, AnniversaryLookupKey)).toBe(ComparersResult.Equal);
        expect(compareService.compare(date1, null, AnniversaryLookupKey, AnniversaryLookupKey)).toBe(ComparersResult.Undetermined);
        expect(compareService.compare(null, date2, AnniversaryLookupKey, AnniversaryLookupKey)).toBe(ComparersResult.Undetermined);
    });
});               