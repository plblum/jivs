import { DataTypeParserBase } from '@plblum/jivs-engine/build/DataTypes/DataTypeParserBase';
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import { ComparersResult } from '@plblum/jivs-engine/build/Interfaces/DataTypeComparerService';
import { DataTypeComparerService } from '@plblum/jivs-engine/build/Services/DataTypeComparerService';
import { DataTypeConverterService } from '@plblum/jivs-engine/build/Services/DataTypeConverterService';
import
    {
        invalidMonthErrorCode, invalidMonthErrorMessage, invalidYearErrorCode,
        invalidYearErrorMessage, MonthYearLookupKey, MonthYearParser, MonthYearParserOptions, UTCMonthYearConverter
    } from '../src/MonthYearDataType';
import { createMinimalJivsServices } from '../src/support';

describe('UTCMonthYearConverter', () => {
    test('canConvert', () => {
        let testItem = new UTCMonthYearConverter();
        expect(testItem.canConvert(new Date(), MonthYearLookupKey, LookupKey.Number)).toBe(true);
        expect(testItem.canConvert(new Date(), MonthYearLookupKey, LookupKey.String)).toBe(false);
        expect(testItem.canConvert(new Date(), null, LookupKey.Number)).toBe(false); // always requires MonthYearLookupKey            
        expect(testItem.canConvert(0, MonthYearLookupKey, LookupKey.Number)).toBe(false);
        expect(testItem.canConvert(null, MonthYearLookupKey, LookupKey.Number)).toBe(false);
    })
    test('convert', () => {
        let testItem = new UTCMonthYearConverter();
        // convert expects to be called after canConvert is true.
        // So no illegal values as parameters tested
        let test1 = new Date(Date.UTC(2000, 10, 5));
        let test1montyear = new Date(Date.UTC(2000, 10, 1));
        let test2 = new Date(Date.UTC(2023, 0, 2, 4, 30));
        let test2monthyear = new Date(Date.UTC(2023, 0, 1));
        expect(testItem.convert(test1, MonthYearLookupKey, LookupKey.Number)).toBe(test1montyear.getTime());
        expect(testItem.convert(test2, MonthYearLookupKey, LookupKey.Number)).toBe(test2monthyear.getTime());
        // dates with an illegal value will convert to undefined
        let illegalDate = new Date('foo');
        expect(testItem.convert(illegalDate, MonthYearLookupKey, LookupKey.Number)).toBeUndefined();
    });
    test('Within dataTypeConverterService', () => {
        let date1 = new Date(Date.UTC(2000, 10, 1));
        let date2 = new Date(Date.UTC(2000, 10, 5, 2, 3, 4));
        let date3 = new Date(Date.UTC(2000, 9, 1));
        let date5 = new Date(Date.UTC(2000, 10, 2));
        let date6 = new Date(Date.UTC(2000, 10, 1, 1, 0, 0));
        let date7 = new Date(Date.UTC(2000, 10, 30, 23, 59, 59));
        let date8 = new Date(Date.UTC(2001, 10, 1));
        
        let vs = createMinimalJivsServices('en');
        let dtcs = vs.dataTypeConverterService as DataTypeConverterService;    
        dtcs.register(new UTCMonthYearConverter());
        let compareService = vs.dataTypeComparerService as DataTypeComparerService;

        expect(compareService.compare(date1, date1, MonthYearLookupKey, MonthYearLookupKey)).toBe(ComparersResult.Equal);
        expect(compareService.compare(date1, date2, MonthYearLookupKey, MonthYearLookupKey)).toBe(ComparersResult.Equal);
        expect(compareService.compare(date5, date1, MonthYearLookupKey, MonthYearLookupKey)).toBe(ComparersResult.Equal);
        expect(compareService.compare(date6, date7, MonthYearLookupKey, MonthYearLookupKey)).toBe(ComparersResult.Equal);
        expect(compareService.compare(date3, date1, MonthYearLookupKey, MonthYearLookupKey)).toBe(ComparersResult.LessThan); 
        expect(compareService.compare(date1, date3, MonthYearLookupKey, MonthYearLookupKey)).toBe(ComparersResult.GreaterThan);            
        expect(compareService.compare(date8, date7, MonthYearLookupKey, MonthYearLookupKey)).toBe(ComparersResult.GreaterThan);            
        // these are due to the DataTypeComparerService.compare function itself
        expect(compareService.compare(null, null, MonthYearLookupKey, MonthYearLookupKey)).toBe(ComparersResult.Equal);
        expect(compareService.compare(date1, null, MonthYearLookupKey, MonthYearLookupKey)).toBe(ComparersResult.Undetermined);
        expect(compareService.compare(null, date2, MonthYearLookupKey, MonthYearLookupKey)).toBe(ComparersResult.Undetermined);
    });
});    

function createParser(
    order: 'my' | 'ym' = 'my',
    separator: string = '/'
): MonthYearParser
{
    const options: MonthYearParserOptions<Date> = { order, separator };
    return new MonthYearParser('MonthYear', ['en-US'], options);
}

// Verify accepted month/year formats produce UTC dates normalized to the first of the month.
describe('MonthYearParser valid input', () =>
{
    test('parses a two-digit year as 20YY and returns UTC midnight on day one', () =>
    {
        const parser = createParser();

        expect(parser.parse('11/26', 'MonthYear', 'en-US')).toEqual({
            value: new Date(Date.UTC(2026, 10, 1))
        });
        expect(parser.parse('11/26', 'MonthYear', 'en-US').value?.toISOString())
            .toBe('2026-11-01T00:00:00.000Z');
    });

    test('parses an unpadded month and a four-digit year', () =>
    {
        const parser = createParser();

        expect(parser.parse('3/2031', 'MonthYear', 'en-US')).toEqual({
            value: new Date(Date.UTC(2031, 2, 1))
        });
    });

    test.each([
        ['1/00', new Date(Date.UTC(2000, 0, 1))],
        ['12/99', new Date(Date.UTC(2099, 11, 1))]
    ])('maps two-digit year boundaries in %s to 20YY', (text, expected) =>
    {
        const parser = createParser();

        expect(parser.parse(text, 'MonthYear', 'en-US')).toEqual({ value: expected });
    });

    test('supports year-first order and escapes a regular-expression separator', () =>
    {
        const parser = createParser('ym', '.');

        expect(parser.parse('2027.4', 'MonthYear', 'en-US')).toEqual({
            value: new Date(Date.UTC(2027, 3, 1))
        });
        expect(parser.parse('2027x4', 'MonthYear', 'en-US').errorDetails)
            .toMatchObject({
                errorMessage: 'Expecting a month and year',
                errorCode: DataTypeParserBase.ParserErrorCode
            });
    });

    test('trims surrounding whitespace before parsing', () =>
    {
        const parser = createParser();

        expect(parser.parse('  03/2031  ', 'MonthYear', 'en-US')).toEqual({
            value: new Date(Date.UTC(2031, 2, 1))
        });
    });

    test('returns null for empty or whitespace-only input', () =>
    {
        const parser = createParser();

        expect(parser.parse('', 'MonthYear', 'en-US')).toEqual({ value: null });
        expect(parser.parse(' \t ', 'MonthYear', 'en-US')).toEqual({ value: null });
    });

});

// Verify malformed input and invalid months become parser errors with stable codes for the UI.
describe('MonthYearParser invalid input', () =>
{
    test.each(['0/26', '13/26'])('rejects invalid month input %s', (text) =>
    {
        const parser = createParser();

        expect(parser.parse(text, 'MonthYear', 'en-US')).toEqual({
            errorDetails: {
                errorMessage: invalidMonthErrorMessage,
                errorMessagel10n: `${ invalidMonthErrorCode }_MonthYear_l10n`,
                errorCode: invalidMonthErrorCode
            }
        });
    });

    test('rejects a four-digit year below 1000', () =>
    {
        const parser = createParser();

        expect(parser.parse('1/0100', 'MonthYear', 'en-US')).toEqual({
            errorDetails: {
                errorMessage: invalidYearErrorMessage,
                errorMessagel10n: `${ invalidYearErrorCode }_MonthYear_l10n`,
                errorCode: invalidYearErrorCode
            }
        });
    });

    test.each(['2026', '1/202', 'month/2026'])(
        'rejects malformed month/year input %s',
        (text) =>
        {
            const parser = createParser();

            expect(parser.parse(text, 'MonthYear', 'en-US')).toEqual({
                errorDetails: {
                    errorMessage: 'Expecting a month and year',
                    errorMessagel10n: `${ DataTypeParserBase.ParserErrorCode }_MonthYear_l10n`,
                    errorCode: DataTypeParserBase.ParserErrorCode
                }
            });
        }
    );
});

// Verify parser selection is limited to its lookup key, supported culture, and recognized input pattern.
describe('MonthYearParser supports', () =>
{
    test('accepts supported month/year text and empty input only for its configured lookup key and culture', () =>
    {
        const parser = createParser();

        expect(parser.supports('MonthYear', 'en-US', '11/26')).toBe(true);
        expect(parser.supports('MonthYear', 'en-US', '')).toBe(true);
        expect(parser.supports('MonthYear', 'en-US', 'not a date')).toBe(false);
        expect(parser.supports('Other', 'en-US', '11/26')).toBe(false);
        expect(parser.supports('MonthYear', 'fr-FR', '11/26')).toBe(false);
    });
});