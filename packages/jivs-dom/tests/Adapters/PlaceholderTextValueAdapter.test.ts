/** @jest-environment jsdom */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { PlaceholderTextValueAdapter } from '../../src/Adapters/PlaceholderTextValueAdapter';
import { createStubFieldValueHost } from '../TestSupport/mocks';

function createValueHost(undefinedText: string): IFieldValueHost
{
    return {
        ...createStubFieldValueHost('CalculatedField'),
        textForUndefinedCalculationValue: () => undefinedText
    };
}

function setup(undefinedText: string = 'Waiting for values'): {
    element: HTMLElement;
    adapter: PlaceholderTextValueAdapter;
}
{
    let element = document.createElement('div');
    let adapter = new PlaceholderTextValueAdapter(
        createValueHost(undefinedText),
        element,
        null
    );
    return { element: element, adapter: adapter };
}

// PlaceholderTextValueAdapter reads and updates an element's textContent, the display surface for the host's text value.
describe('PlaceholderTextValueAdapter readTextValue and writeTextValue', () => {
    test('Writes and reads ordinary text through textContent', () => {
        let { element, adapter } = setup();

        adapter.writeTextValue('Calculated result');

        expect(element.textContent).toBe('Calculated result');
        expect(adapter.readTextValue()).toBe('Calculated result');
    });

    test('Replaces previously displayed text when the host value changes', () => {
        let { element, adapter } = setup();
        adapter.writeTextValue('Earlier result');

        adapter.writeTextValue('Updated result');

        expect(element.textContent).toBe('Updated result');
        expect(adapter.readTextValue()).toBe('Updated result');
    });

    test('Displays the FieldValueHost undefined-calculation text for undefined values', () => {
        let { element, adapter } = setup('Calculation pending');

        adapter.writeTextValue(undefined);

        expect(element.textContent).toBe('Calculation pending');
        expect(adapter.readTextValue()).toBe('Calculation pending');
    });

    test('Preserves an empty string instead of substituting the undefined-calculation text', () => {
        let { element, adapter } = setup('Calculation pending');

        adapter.writeTextValue('');

        expect(element.textContent).toBe('');
        expect(adapter.readTextValue()).toBe('');
    });

    test('Reads textContent that was changed outside of the adapter', () => {
        let { element, adapter } = setup();
        element.textContent = 'Externally updated';

        expect(adapter.readTextValue()).toBe('Externally updated');
    });
});

// Disposal releases inherited element references, preventing further reads and writes through the adapter.
describe('PlaceholderTextValueAdapter.dispose', () => {
    test('Clears inherited element references', () => {
        let { adapter } = setup();

        adapter.dispose();

        expect(() => adapter.readTextValue()).toThrow(TypeError);
        expect(() => adapter.writeTextValue('After disposal')).toThrow(TypeError);
    });
});
