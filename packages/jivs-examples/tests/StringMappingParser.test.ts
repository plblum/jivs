import { DataTypeParserBase } from '@plblum/jivs-engine/build/DataTypes/DataTypeParserBase';
import { StringMappingParser } from '../src/StringMappingParser';

// Verify canonical and alias mapping so user-entered variants reliably become the configured value.
describe('StringMappingParser mapping', () => {
    const mapping = [
        ['CA', 'Calif', 'California'],
        ['MA', 'Mass', 'Massachusetts']
    ];

    test('maps canonical values and aliases to the canonical spelling', () => {
        const parser = new StringMappingParser('State', { mapping });

        expect(parser.parse('CA', 'State', 'en-US')).toEqual({ value: 'CA' });
        expect(parser.parse('ca', 'State', 'en-US')).toEqual({ value: 'CA' });
        expect(parser.parse('Calif', 'State', 'en-US')).toEqual({ value: 'CA' });
        expect(parser.parse('CALIFORNIA', 'State', 'en-US')).toEqual({ value: 'CA' });
        expect(parser.parse('maSS', 'State', 'en-US')).toEqual({ value: 'MA' });
    });

    test('matches exactly when case-insensitive matching is disabled', () => {
        const parser = new StringMappingParser('State', {
            mapping,
            caseInsensitive: false
        });

        expect(parser.parse('California', 'State', 'en-US')).toEqual({ value: 'CA' });
        expect(parser.parse('CALIFORNIA', 'State', 'en-US')).toMatchObject({
            errorDetails: {
                errorMessagel10n: 'ParserError_State_l10n',
                errorCode: DataTypeParserBase.ParserErrorCode
            }
        });
    });
    test('trimming whitespace from input', () => {
        const parser = new StringMappingParser('State', { mapping });

        expect(parser.parse('  CA  ', 'State', 'en-US')).toEqual({ value: 'CA' });
        expect(parser.parse('  Calif  ', 'State', 'en-US')).toEqual({ value: 'CA' });
    });

    test('returns an empty result for empty or whitespace-only input by default', () => {
        const parser = new StringMappingParser('State', { mapping });

        expect(parser.parse('', 'State', 'en-US')).toEqual({ value: '' });
        expect(parser.parse('  \t ', 'State', 'en-US')).toEqual({ value: '' });
    });

    test('uses the configured empty-string result', () => {
        const parser = new StringMappingParser('State', {
            mapping,
            emptyStringResult: null
        });

        expect(parser.parse('', 'State', 'en-US')).toEqual({ value: null });
    });
});

// Verify unmatched values either produce configured validation details or pass through for separate validation.
describe('StringMappingParser unmatched values', () => {
    const mapping = [['CA', 'California']];
    test('reports validation error using default message', () => {
        const parser = new StringMappingParser('Country', { mapping });

        expect(parser.parse('France', 'Country', 'en-US')).toEqual({
            errorDetails: {
                errorMessage: 'Invalid entry',
                errorMessagel10n: DataTypeParserBase.ParserErrorCode + '_Country_l10n',
                errorCode: DataTypeParserBase.ParserErrorCode
            }
        });
    });

    test('reports a validation error with a configured message', () => {
        const parser = new StringMappingParser('Country', {
            mapping,
            errorMessage: 'Choose a supported country.'
        });

        expect(parser.parse('France', 'Country', 'en-US')).toEqual({
            errorDetails: {
                errorMessage: 'Choose a supported country.',
                errorMessagel10n: 'ParserError_Country_l10n',
                errorCode: DataTypeParserBase.ParserErrorCode
            }
        });
    });

    test('returns an unmatched value unchanged when validation errors are disabled', () => {
        const parser = new StringMappingParser('Country', {
            mapping,
            reportValidationError: false
        });

        expect(parser.parse('France', 'Country', 'en-US')).toEqual({ value: 'France' });
    });
});
