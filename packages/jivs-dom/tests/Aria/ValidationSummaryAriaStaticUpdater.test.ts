import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { ValidationSummaryAriaStaticUpdater } from '../../src/Aria/ValidationSummaryAriaStaticUpdater';
import { ElementRole } from '../../src/Interfaces/Types';

/**
 * Creates a summary element and its static ARIA updater.
 */
function setup(): {
    element: IJivsElement,
    testItem: ValidationSummaryAriaStaticUpdater
}
{
    return {
        element: document.createElement('div') as IJivsElement,
        testItem: new ValidationSummaryAriaStaticUpdater()
    };
}

// The validation summary receives status live-region semantics when the caller identifies it as a summary.
describe('ValidationSummaryAriaStaticUpdater.applyStaticAttributes', () => {
    test('Adds role=status, aria-atomic=true, and aria-live=polite to a summary', () => {
        let { element, testItem } = setup();

        testItem.applyStaticAttributes(element, ElementRole.summary);

        expect(element.getAttribute('role')).toBe('status');
        expect(element.getAttribute('aria-atomic')).toBe('true');
        expect(element.getAttribute('aria-live')).toBe('polite');
    });
    test('Does not add summary attributes to a non-summary role', () => {
        let { element, testItem } = setup();

        testItem.applyStaticAttributes(element, ElementRole.container);

        expect(element.hasAttribute('role')).toBe(false);
        expect(element.hasAttribute('aria-atomic')).toBe(false);
        expect(element.hasAttribute('aria-live')).toBe(false);
    });
    test('Does not add summary attributes to an unknown custom role', () => {
        let { element, testItem } = setup();

        testItem.applyStaticAttributes(element, 'custom-summary-role');

        expect(element.hasAttribute('role')).toBe(false);
        expect(element.hasAttribute('aria-atomic')).toBe(false);
        expect(element.hasAttribute('aria-live')).toBe(false);
    });
});

// Static summary semantics must preserve authored values independently for each managed attribute.
describe('ValidationSummaryAriaStaticUpdater preserves authored attributes', () => {
    test('Preserves an existing role while adding missing live-region attributes', () => {
        let { element, testItem } = setup();
        element.setAttribute('role', 'region');

        testItem.applyStaticAttributes(element, ElementRole.summary);

        expect(element.getAttribute('role')).toBe('region');
        expect(element.getAttribute('aria-atomic')).toBe('true');
        expect(element.getAttribute('aria-live')).toBe('polite');
    });
    test('Preserves existing aria-atomic and aria-live values while adding the missing role', () => {
        let { element, testItem } = setup();
        element.setAttribute('aria-atomic', 'false');
        element.setAttribute('aria-live', 'assertive');

        testItem.applyStaticAttributes(element, ElementRole.summary);

        expect(element.getAttribute('role')).toBe('status');
        expect(element.getAttribute('aria-atomic')).toBe('false');
        expect(element.getAttribute('aria-live')).toBe('assertive');
    });
    test('Preserves existing empty values for all managed attributes', () => {
        let { element, testItem } = setup();
        element.setAttribute('role', '');
        element.setAttribute('aria-atomic', '');
        element.setAttribute('aria-live', '');

        testItem.applyStaticAttributes(element, ElementRole.summary);

        expect(element.hasAttribute('role')).toBe(true);
        expect(element.hasAttribute('aria-atomic')).toBe(true);
        expect(element.hasAttribute('aria-live')).toBe(true);
        expect(element.getAttribute('role')).toBe('');
        expect(element.getAttribute('aria-atomic')).toBe('');
        expect(element.getAttribute('aria-live')).toBe('');
    });
    test('Applies summary semantics without a value host', () => {
        let { element, testItem } = setup();

        testItem.applyStaticAttributes(element, ElementRole.summary);

        expect(element.getAttribute('role')).toBe('status');
        expect(element.getAttribute('aria-atomic')).toBe('true');
        expect(element.getAttribute('aria-live')).toBe('polite');
    });
});
