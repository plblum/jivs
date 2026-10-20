/** @jest-environment jsdom */
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { RequiredIndicatorAriaStaticUpdater } from '../../src/Aria/RequiredIndicatorAriaStaticUpdater';
import { ElementRole } from '../../src/Interfaces/Types';

/**
 * Creates a required-indicator element and its static ARIA updater.
 */
function setup(): {
    element: IJivsElement,
    testItem: RequiredIndicatorAriaStaticUpdater
}
{
    return {
        element: document.createElement('span') as IJivsElement,
        testItem: new RequiredIndicatorAriaStaticUpdater()
    };
}

// RequiredIndicatorAriaStaticUpdater hides only required-indicator elements from assistive technology.
describe('RequiredIndicatorAriaStaticUpdater.applyStaticAttributes', () => {
    test('Adds aria-hidden=true to a required-indicator element', () => {
        let { element, testItem } = setup();

        testItem.applyStaticAttributes(element, ElementRole.required);

        expect(element.getAttribute('aria-hidden')).toBe('true');
    });
    test('Does not add aria-hidden for a non-required role', () => {
        let { element, testItem } = setup();

        testItem.applyStaticAttributes(element, ElementRole.label);

        expect(element.hasAttribute('aria-hidden')).toBe(false);
    });
    test('Does not add aria-hidden for an unknown custom role', () => {
        let { element, testItem } = setup();

        testItem.applyStaticAttributes(element, 'custom-required-role');

        expect(element.hasAttribute('aria-hidden')).toBe(false);
    });
    test('Preserves an author-provided aria-hidden=false value', () => {
        let { element, testItem } = setup();
        element.setAttribute('aria-hidden', 'false');

        testItem.applyStaticAttributes(element, ElementRole.required);

        expect(element.getAttribute('aria-hidden')).toBe('false');
    });
    test('Preserves an existing empty aria-hidden attribute', () => {
        let { element, testItem } = setup();
        element.setAttribute('aria-hidden', '');

        testItem.applyStaticAttributes(element, ElementRole.required);

        expect(element.hasAttribute('aria-hidden')).toBe(true);
        expect(element.getAttribute('aria-hidden')).toBe('');
    });
});
