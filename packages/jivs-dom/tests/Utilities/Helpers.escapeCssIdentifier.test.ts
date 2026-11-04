/** @jest-environment jsdom */

import { escapeCssIdentifier } from '../../src/Utilities/Helpers';

// escapeCssIdentifier makes field names safe inside selectors. jsdom has no CSS.escape,
// so these tests exercise the fallback that mirrors its rules, and prove the result works in querySelector.
describe('escapeCssIdentifier', () => {
    test('Leaves letters, digits (after the first), underscores, hyphens and non-ASCII unchanged', () => {
        expect(escapeCssIdentifier('email_1-x')).toBe('email_1-x');
        expect(escapeCssIdentifier('naïve')).toBe('naïve');
    });

    test('Escapes punctuation and spaces with a backslash', () => {
        expect(escapeCssIdentifier('a.b[0]')).toBe('a\\.b\\[0\\]');
        expect(escapeCssIdentifier('a b')).toBe('a\\ b');
        expect(escapeCssIdentifier('a"b')).toBe('a\\"b');
    });

    test('Escapes a leading digit, a digit after a leading hyphen, and a lone hyphen', () => {
        expect(escapeCssIdentifier('1a')).toBe('\\31 a');
        expect(escapeCssIdentifier('-1a')).toBe('-\\31 a');
        expect(escapeCssIdentifier('-')).toBe('\\-');
    });

    test('Replaces NUL and escapes control characters', () => {
        expect(escapeCssIdentifier('a\u0000b')).toBe('a\uFFFDb');
        expect(escapeCssIdentifier('a\u0001b')).toBe('a\\1 b');
    });

    test('Returns an empty string for an empty string', () => {
        expect(escapeCssIdentifier('')).toBe('');
    });

    test('Produces identifiers that querySelector matches to the original attribute value', () => {
        let values = ['email', 'a.b[0]', '1abc', 'x y', 'q"r'];
        for (let value of values)
        {
            let element = document.createElement('div');
            element.setAttribute('data-field', value);
            document.body.appendChild(element);

            expect(document.querySelector(`[data-field=${ escapeCssIdentifier(value) }]`)).toBe(element);
            expect(document.querySelector(`[data-field="${ escapeCssIdentifier(value) }"]`)).toBe(element);
            element.remove();
        }
    });
});
