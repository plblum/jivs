import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { CheckboxTextValueAdapter } from '../../src/Adapters/CheckboxTextValueAdapter';

/**
 * Creates a checkbox adapter with a configured string value and optional associated Jivs element.
 * @param jivsElement - Defaults to null, which uses the checkbox as the Jivs element.
 */
function setup(jivsElement: IJivsElement | null = null): {
    element: HTMLInputElement,
    testItem: CheckboxTextValueAdapter
}
{
    let element = document.createElement('input');
    element.type = 'checkbox';
    element.value = 'accepted';
    return {
        element: element,
        testItem: new CheckboxTextValueAdapter(element, jivsElement)
    };
}

// CheckboxTextValueAdapter requires an input element and supports a separate associated Jivs element.
describe('CheckboxTextValueAdapter constructor', () => {
    test('Uses the checkbox as the Jivs element when none is supplied', () => {
        let { element, testItem } = setup();

        expect(testItem.readTextValue()).toBe('');
        testItem.writeTextValue('accepted');
        expect(element.checked).toBe(true);
    });
    test('Accepts null as the associated Jivs element and uses the checkbox as the fallback', () => {
        let element = document.createElement('input');
        element.type = 'checkbox';
        element.value = 'accepted';
        let testItem = new CheckboxTextValueAdapter(element, null);

        testItem.writeTextValue('accepted');

        expect(element.checked).toBe(true);
        expect(testItem.readTextValue()).toBe('accepted');
    });
    test('Rejects a null checkbox element', () => {
        expect(() => new CheckboxTextValueAdapter(null!)).toThrow(/element/);
    });
    test('Rejects an undefined checkbox element', () => {
        expect(() => new CheckboxTextValueAdapter(undefined!)).toThrow(/element/);
    });
    test('Reads and writes the checkbox while retaining a separate Jivs element', () => {
        let element = document.createElement('input');
        element.type = 'checkbox';
        element.value = 'accepted';
        let jivsElement = document.createElement('section');
        let testItem = new CheckboxTextValueAdapter(element, jivsElement);

        testItem.writeTextValue('accepted');

        expect(element.checked).toBe(true);
        expect(testItem.readTextValue()).toBe('accepted');
    });
});

// The adapter maps checkbox checked state to its configured string value and maps the unchecked state to an empty string.
describe('CheckboxTextValueAdapter readTextValue', () => {
    test('Reads the configured value when the checkbox is checked', () => {
        let { element, testItem } = setup();
        element.checked = true;

        expect(testItem.readTextValue()).toBe('accepted');
    });
    test('Reads an empty string when the checkbox is unchecked', () => {
        let { element, testItem } = setup();
        element.checked = false;

        expect(testItem.readTextValue()).toBe('');
    });
});

// Writing the configured value checks the checkbox; any other text value, including undefined, clears it.
describe('CheckboxTextValueAdapter.writeTextValue', () => {
    test('Checks the checkbox when writing its configured value', () => {
        let { element, testItem } = setup();

        testItem.writeTextValue('accepted');

        expect(element.checked).toBe(true);
        expect(testItem.readTextValue()).toBe('accepted');
    });
    test('Unchecks the checkbox when writing a different string value', () => {
        let { element, testItem } = setup();
        element.checked = true;

        testItem.writeTextValue('not-accepted');

        expect(element.checked).toBe(false);
        expect(testItem.readTextValue()).toBe('');
    });
    test('Unchecks the checkbox when writing an empty string that differs from its configured value', () => {
        let { element, testItem } = setup();
        element.checked = true;

        testItem.writeTextValue('');

        expect(element.checked).toBe(false);
        expect(testItem.readTextValue()).toBe('');
    });
    test('Unchecks the checkbox when writing undefined', () => {
        let { element, testItem } = setup();
        element.checked = true;

        testItem.writeTextValue(undefined);

        expect(element.checked).toBe(false);
        expect(testItem.readTextValue()).toBe('');
    });
});

// Disposing the concrete adapter releases the element references inherited from AdapterBase.
describe('CheckboxTextValueAdapter.dispose', () => {
    test('Clears the inherited DOM and Jivs element references', () => {
        let { testItem } = setup();

        testItem.dispose();

        expect(() => testItem.readTextValue()).toThrow(TypeError);
        expect(() => testItem.writeTextValue('accepted')).toThrow(TypeError);
    });
});
