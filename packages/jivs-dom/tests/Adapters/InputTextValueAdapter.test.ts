/** @jest-environment jsdom */
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { InputTextValueAdapter } from '../../src/Adapters/InputTextValueAdapter';

/**
 * Creates an input adapter with an optional associated Jivs element.
 * @param jivsElement - Defaults to null, which uses the input as the Jivs element.
 */
function setup(jivsElement: IJivsElement | null = null): {
    element: HTMLInputElement,
    testItem: InputTextValueAdapter
}
{
    let element = document.createElement('input');
    return {
        element: element,
        testItem: new InputTextValueAdapter(element, jivsElement)
    };
}

// InputTextValueAdapter requires an input element and forwards the optional associated Jivs element to its base class.
describe('InputTextValueAdapter constructor', () => {
    test('Uses the input element as the Jivs element when none is supplied', () => {
        let { element, testItem } = setup();

        expect(testItem.readTextValue()).toBe('');
        expect(() => testItem.writeTextValue('Initial value')).not.toThrow();
        expect(element.value).toBe('Initial value');
    });
    test('Accepts an explicit null associated Jivs element and uses the input element as the fallback', () => {
        let element = document.createElement('input');
        let testItem = new InputTextValueAdapter(element, null);

        expect(() => testItem.writeTextValue('Fallback value')).not.toThrow();
        expect(element.value).toBe('Fallback value');
    });
    test('Rejects a null input element', () => {
        expect(() => new InputTextValueAdapter(null!)).toThrow(/element/);
    });
    test('Rejects an undefined input element', () => {
        expect(() => new InputTextValueAdapter(undefined!)).toThrow(/element/);
    });
    test('Can use a separate Jivs element while reading and writing the input', () => {
        let element = document.createElement('input');
        let jivsElement = document.createElement('section');
        let testItem = new InputTextValueAdapter(element, jivsElement);
        element.value = 'Editor text';

        expect(testItem.readTextValue()).toBe('Editor text');
        testItem.writeTextValue('Updated text');
        expect(element.value).toBe('Updated text');
    });
});

// The adapter reads the current input value and writes text values without changing ordinary or empty strings.
describe('InputTextValueAdapter readTextValue and writeTextValue', () =>
{
    test('Reads user-entered input text', () =>
    {
        let { element, testItem } = setup();
        element.value = 'User-entered text';

        expect(testItem.readTextValue()).toBe('User-entered text');
    });
    test('Writes ordinary text to the input element', () =>
    {
        let { element, testItem } = setup();

        testItem.writeTextValue('Updated text');

        expect(element.value).toBe('Updated text');
        expect(testItem.readTextValue()).toBe('Updated text');
    });

    test('Preserves an empty string when writing text to the input element', () =>
    {
        let { element, testItem } = setup();
        element.value = 'Existing text';

        testItem.writeTextValue('');

        expect(element.value).toBe('');
        expect(testItem.readTextValue()).toBe('');
    });
    test('Represents an undefined text value as an empty input value', () =>
    {
        let { element, testItem } = setup();
        element.value = 'Existing text';

        testItem.writeTextValue(undefined);

        expect(element.value).toBe('');
        expect(testItem.readTextValue()).toBe('');
    });

    describe('With various type attributes that support textbox entry', () =>
    {
        function testOne(type: string, value: string, updatedValue: string)
        {
            let { element, testItem } = setup();
            element.setAttribute('type', type);
            element.value = value;

            expect(testItem.readTextValue()).toBe(value);

            testItem.writeTextValue(updatedValue);
            expect(element.value).toBe(updatedValue);
            expect(testItem.readTextValue()).toBe(updatedValue);
        }
        test('Reads and writes text with type="text"', () =>
        {
            testOne('text', 'User-entered text', 'Updated value');
        });
        test('Reads and writes text with type="search"', () =>
        {
            testOne('search', 'User-entered text', 'Updated value');
        });
        test('Reads and writes text with type="tel"', () =>
        {
            testOne('tel', 'User-entered text', 'Updated value');
        });
        test('Reads and writes text with type="url"', () =>
        {
            testOne('url', 'User-entered text', 'Updated value');
        });
        test('Reads and writes text with type="email"', () =>
        {
            testOne('email', 'User-entered text', 'Updated value');
        });
        test('Reads and writes text with type="password"', () =>
        {
            testOne('password', 'User-entered text', 'Updated value');
        }); 
        test('Reads and writes text with type="number"', () =>
        {
            testOne('number', '10', '20');
        });
        test('Reads and writes text with type="range"', () =>
        {
            testOne('range', '10', '20');
        });
        test('Reads and writes text with type="date"', () =>
        {
            testOne('date', '2024-06-01', '2024-06-02');
        });
        test('Reads and writes text with type="month"', () =>
        {
            testOne('month', '2024-06', '2024-07');
        });
        test('Reads and writes text with type="week"', () =>
        {
            testOne('week', '2024-W23', '2024-W24');
        });
        test('Reads and writes text with type="time"', () =>
        {
            testOne('time', '12:00', '13:00');
        });
        test('Reads and writes text with type="datetime-local"', () =>
        {
            testOne('datetime-local', '2024-06-01T12:00', '2024-06-01T13:00');
        });
        test('Reads and writes text with type="color"', () =>
        {
            testOne('color', '#ff0000', '#00ff00');
        });
    });
});

// Disposing the concrete adapter releases the element references inherited from AdapterBase.
describe('InputTextValueAdapter.dispose', () => {
    test('Clears the inherited DOM and Jivs element references', () => {
        let { testItem } = setup();

        testItem.dispose();

        expect(() => testItem.readTextValue()).toThrow(TypeError);
        expect(() => testItem.writeTextValue('After disposal')).toThrow(TypeError);
    });
});
