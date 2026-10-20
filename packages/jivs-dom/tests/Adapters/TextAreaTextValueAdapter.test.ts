/** @jest-environment jsdom */
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { TextAreaTextValueAdapter } from '../../src/Adapters/TextAreaTextValueAdapter';

/**
 * Creates a textarea adapter with an optional associated Jivs element.
 * @param jivsElement - Defaults to null, which uses the textarea as the Jivs element.
 */
function setup(jivsElement: IJivsElement | null = null): {
    element: HTMLTextAreaElement,
    testItem: TextAreaTextValueAdapter
}
{
    let element = document.createElement('textarea');
    return {
        element: element,
        testItem: new TextAreaTextValueAdapter(element, jivsElement)
    };
}

// TextAreaTextValueAdapter must use the textarea as its default Jivs element and allow a distinct associated element.
describe('TextAreaTextValueAdapter constructor', () => {
    test('Uses the textarea as the Jivs element when none is supplied', () => {
        let { element, testItem } = setup();

        expect(testItem.readTextValue()).toBe('');
        testItem.writeTextValue('Initial text');
        expect(element.value).toBe('Initial text');
    });
    test('Accepts null as the associated Jivs element and uses the textarea as the fallback', () => {
        let element = document.createElement('textarea');
        let testItem = new TextAreaTextValueAdapter(element, null);

        testItem.writeTextValue('Fallback text');

        expect(element.value).toBe('Fallback text');
        expect(testItem.readTextValue()).toBe('Fallback text');
    });
    test('Rejects a null textarea element', () => {
        expect(() => new TextAreaTextValueAdapter(null!)).toThrow(/element/);
    });
    test('Rejects an undefined textarea element', () => {
        expect(() => new TextAreaTextValueAdapter(undefined!)).toThrow(/element/);
    });
    test('Reads and writes the textarea while retaining a separate Jivs element', () => {
        let element = document.createElement('textarea');
        let jivsElement = document.createElement('section');
        let testItem = new TextAreaTextValueAdapter(element, jivsElement);
        element.value = 'First line\nSecond line';

        expect(testItem.readTextValue()).toBe('First line\nSecond line');
        testItem.writeTextValue('Updated first line\nUpdated second line');
        expect(element.value).toBe('Updated first line\nUpdated second line');
    });
});

// Textarea value synchronization must preserve multiline text and map an absent text value to an empty value.
describe('TextAreaTextValueAdapter readTextValue and writeTextValue', () => {
    test('Reads multiline text entered in the textarea', () => {
        let { element, testItem } = setup();
        element.value = 'A paragraph\nwith a second line';

        expect(testItem.readTextValue()).toBe('A paragraph\nwith a second line');
    });
    test('Writes multiline text to the textarea without losing line breaks', () => {
        let { element, testItem } = setup();
        let multilineText = 'First paragraph\nSecond paragraph\nThird paragraph';

        testItem.writeTextValue(multilineText);

        expect(element.value).toBe(multilineText);
        expect(testItem.readTextValue()).toBe(multilineText);
    });
    test('Preserves an empty string when writing text to the textarea', () => {
        let { element, testItem } = setup();
        element.value = 'Existing text';

        testItem.writeTextValue('');

        expect(element.value).toBe('');
        expect(testItem.readTextValue()).toBe('');
    });
    test('Represents an undefined text value as an empty textarea value', () => {
        let { element, testItem } = setup();
        element.value = 'Existing text';

        testItem.writeTextValue(undefined);

        expect(element.value).toBe('');
        expect(testItem.readTextValue()).toBe('');
    });
});

// Disposing the concrete adapter releases the element references inherited from AdapterBase.
describe('TextAreaTextValueAdapter.dispose', () => {
    test('Clears the inherited DOM and Jivs element references', () => {
        let { testItem } = setup();

        testItem.dispose();

        expect(() => testItem.readTextValue()).toThrow(TypeError);
        expect(() => testItem.writeTextValue('After disposal')).toThrow(TypeError);
    });
});
