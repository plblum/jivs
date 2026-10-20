/** @jest-environment jsdom */
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { SelectTextValueAdapter } from '../../src/Adapters/SelectTextValueAdapter';

/**
 * Creates a single-value select adapter with two options and an optional associated Jivs element.
 * @param jivsElement - Defaults to null, which uses the select as the Jivs element.
 */
function setup(jivsElement: IJivsElement | null = null): {
    element: HTMLSelectElement,
    testItem: SelectTextValueAdapter
}
{
    let element = document.createElement('select');
    let firstOption = document.createElement('option');
    firstOption.value = 'first-value';
    firstOption.text = 'First label';
    let secondOption = document.createElement('option');
    secondOption.value = 'second-value';
    secondOption.text = 'Second label';
    element.append(firstOption, secondOption);
    return {
        element: element,
        testItem: new SelectTextValueAdapter(element, jivsElement)
    };
}

// SelectTextValueAdapter requires a select element and supports a separate element for its associated Jivs properties.
describe('SelectTextValueAdapter constructor', () => {
    test('Uses the select element as the Jivs element when none is supplied', () => {
        let { element, testItem } = setup();

        expect(testItem.readTextValue()).toBe('first-value');
        testItem.writeTextValue('second-value');
        expect(element.value).toBe('second-value');
    });
    test('Accepts null as the associated Jivs element and uses the select as the fallback', () => {
        let element = document.createElement('select');
        let option = document.createElement('option');
        option.value = 'choice';
        element.append(option);
        let testItem = new SelectTextValueAdapter(element, null);

        testItem.writeTextValue('choice');

        expect(testItem.readTextValue()).toBe('choice');
    });
    test('Rejects a null select element', () => {
        expect(() => new SelectTextValueAdapter(null!)).toThrow(/element/);
    });
    test('Rejects an undefined select element', () => {
        expect(() => new SelectTextValueAdapter(undefined!)).toThrow(/element/);
    });
    test('Reads and writes the select while retaining a separate Jivs element', () => {
        let element = document.createElement('select');
        let option = document.createElement('option');
        option.value = 'option-value';
        option.text = 'Option label';
        element.append(option);
        let jivsElement = document.createElement('section');
        let testItem = new SelectTextValueAdapter(element, jivsElement);

        expect(testItem.readTextValue()).toBe('option-value');
        testItem.writeTextValue('option-value');
        expect(element.value).toBe('option-value');
    });
});

// The adapter must synchronize the selected option's value, not its label or position.
describe('SelectTextValueAdapter readTextValue and writeTextValue', () => {
    test('Reads the selected option value instead of its label', () => {
        let { element, testItem } = setup();
        element.selectedIndex = 1;

        expect(testItem.readTextValue()).toBe('second-value');
        expect(testItem.readTextValue()).not.toBe('Second label');
    });
    test('Writes a value by selecting the option with that value', () => {
        let { element, testItem } = setup();

        testItem.writeTextValue('second-value');

        expect(element.selectedIndex).toBe(1);
        expect(testItem.readTextValue()).toBe('second-value');
    });
    test('Clears the selection when writing a value that is not present among the options', () => {
        let { element, testItem } = setup();

        testItem.writeTextValue('missing-value');

        expect(element.selectedIndex).toBe(-1);
        expect(testItem.readTextValue()).toBe('');
    });
    test('Writes an undefined value as an empty value and selects the matching empty option', () => {
        let { element, testItem } = setup();
        let emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.text = 'Choose an option';
        element.prepend(emptyOption);
        element.value = 'first-value';

        testItem.writeTextValue(undefined);

        expect(element.selectedIndex).toBe(0);
        expect(testItem.readTextValue()).toBe('');
    });
});

// Disposing the concrete adapter releases the element references inherited from AdapterBase.
describe('SelectTextValueAdapter.dispose', () => {
    test('Clears the inherited DOM and Jivs element references', () => {
        let { testItem } = setup();

        testItem.dispose();

        expect(() => testItem.readTextValue()).toThrow(TypeError);
        expect(() => testItem.writeTextValue('second-value')).toThrow(TypeError);
    });
});
