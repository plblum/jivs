/** @jest-environment jsdom */
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { RadioButtonsTextValueAdapterBase } from '../../src/Adapters/RadioButtonsTextValueAdapterBase';

/**
 * Test adapter that supplies a fixed radio group to the shared base behavior.
 */
class TestRadioButtonsTextValueAdapter extends RadioButtonsTextValueAdapterBase
{
    public constructor(element: HTMLElement, jivsElement: IJivsElement | null, private radios: HTMLInputElement[])
    {
        super(element, jivsElement);
    }

    protected getRadios(): HTMLInputElement[]
    {
        return this.radios;
    }

    public get publicify_element(): HTMLElement
    {
        return this.element;
    }

    public get publicify_jivsElement(): IJivsElement
    {
        return this.jivsElement;
    }
}

/**
 * Creates a root element, radio group and test adapter.
 * @param values - Values assigned to the radio buttons, in group order.
 */
function setup(values: string[] = ['first', 'second', 'third']): {
    element: HTMLElement,
    radios: HTMLInputElement[],
    testItem: TestRadioButtonsTextValueAdapter
}
{
    let element = document.createElement('div');
    let radios = values.map((value) => {
        let radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'test-group';
        radio.value = value;
        element.append(radio);
        return radio;
    });
    return {
        element: element,
        radios: radios,
        testItem: new TestRadioButtonsTextValueAdapter(element, null, radios)
    };
}

// The radio-group base requires its anchor element and preserves an optional associated Jivs element.
describe('RadioButtonsTextValueAdapterBase constructor', () => {
    test('Uses the group element as the Jivs element when none is supplied', () => {
        let { element, testItem } = setup();

        expect(testItem.publicify_element).toBe(element);
        expect(testItem.publicify_jivsElement).toBe(element);
    });
    test('Uses the group element as the Jivs element when the associated element is undefined', () => {
        let element = document.createElement('div');
        let testItem = new TestRadioButtonsTextValueAdapter(element, undefined!, []);

        expect(testItem.publicify_jivsElement).toBe(element);
    });
    test('Retains a distinct associated Jivs element', () => {
        let element = document.createElement('div');
        let jivsElement = document.createElement('section');
        let testItem = new TestRadioButtonsTextValueAdapter(element, jivsElement, []);

        expect(testItem.publicify_element).toBe(element);
        expect(testItem.publicify_jivsElement).toBe(jivsElement);
    });
    test('Rejects a null group element', () => {
        expect(() => new TestRadioButtonsTextValueAdapter(null!, null, [])).toThrow(/element/);
    });
    test('Rejects an undefined group element', () => {
        expect(() => new TestRadioButtonsTextValueAdapter(undefined!, null, [])).toThrow(/element/);
    });
});

// Reading returns the selected radio's value or undefined when no radio is selected.
describe('RadioButtonsTextValueAdapterBase.readTextValue', () => {
    test('Returns the value of the selected radio button', () => {
        let { radios, testItem } = setup();
        radios[1].checked = true;

        expect(testItem.readTextValue()).toBe('second');
    });
    test('Returns undefined when no radio button is selected', () => {
        let { testItem } = setup();

        expect(testItem.readTextValue()).toBeUndefined();
    });
    test('Returns the selected radio value when it occurs after unchecked members', () => {
        let { radios, testItem } = setup();
        radios[2].checked = true;

        expect(testItem.readTextValue()).toBe('third');
    });
    test('Returns undefined for an empty radio group', () => {
        let { element } = setup([]);
        let testItem = new TestRadioButtonsTextValueAdapter(element, null, []);

        expect(testItem.readTextValue()).toBeUndefined();
    });
});

// Writing selects only the first radio with a matching value and clears every radio when no value matches.
describe('RadioButtonsTextValueAdapterBase.writeTextValue', () => {
    test('Checks the radio with the matching value and clears the rest', () => {
        let { radios, testItem } = setup();
        radios[0].checked = true;

        testItem.writeTextValue('second');

        expect(radios.map((radio) => radio.checked)).toEqual([false, true, false]);
        expect(testItem.readTextValue()).toBe('second');
    });
    test('Checks only the first radio when more than one radio has the matching value', () => {
        let { element } = setup(['same', 'same', 'other']);
        let radios = Array.from(element.querySelectorAll('input'));
        let testItem = new TestRadioButtonsTextValueAdapter(element, null, radios);

        testItem.writeTextValue('same');

        expect(radios.map((radio) => radio.checked)).toEqual([true, false, false]);
    });
    test('Clears all radio buttons when the written value is not in the group', () => {
        let { radios, testItem } = setup();
        radios[0].checked = true;
        radios[2].checked = true;

        testItem.writeTextValue('missing');

        expect(radios.map((radio) => radio.checked)).toEqual([false, false, false]);
        expect(testItem.readTextValue()).toBeUndefined();
    });
    test('Clears all radio buttons when the written value is undefined', () => {
        let { radios, testItem } = setup();
        radios[1].checked = true;

        testItem.writeTextValue(undefined);

        expect(radios.map((radio) => radio.checked)).toEqual([false, false, false]);
        expect(testItem.readTextValue()).toBeUndefined();
    });
    test('Leaves an empty radio group unchanged when writing a value', () => {
        let { element } = setup([]);
        let testItem = new TestRadioButtonsTextValueAdapter(element, null, []);

        expect(() => testItem.writeTextValue('missing')).not.toThrow();
        expect(testItem.readTextValue()).toBeUndefined();
    });
});

// A radio button can itself be the IJivsElement while the adapter reads and writes the complete radio group.
describe('RadioButtonsTextValueAdapterBase with a radio button as IJivsElement', () => {
    test('Reads the selected value and updates the group when the anchor radio is the Jivs element', () => {
        let parent = document.createElement('div');
        let radios = ['first', 'second'].map((value) => {
            let radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'radio-anchor';
            radio.value = value;
            parent.append(radio);
            return radio;
        });
        let testItem = new TestRadioButtonsTextValueAdapter(radios[0], null, radios);
        radios[1].checked = true;

        expect(testItem.publicify_element).toBe(radios[0]);
        expect(testItem.publicify_jivsElement).toBe(radios[0]);
        expect(testItem.readTextValue()).toBe('second');

        testItem.writeTextValue('first');

        expect(radios.map((radio) => radio.checked)).toEqual([true, false]);
        expect(testItem.readTextValue()).toBe('first');
    });
});

// A containing div can hold the IJivsElement properties while the adapter retains one radio as its value anchor.
describe('RadioButtonsTextValueAdapterBase with a containing div as IJivsElement', () => {
    test('Reads the selected value and updates the group through the radio anchor', () => {
        let container = document.createElement('div');
        let radios = ['first', 'second'].map((value) => {
            let radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'radio-container';
            radio.value = value;
            container.append(radio);
            return radio;
        });
        let testItem = new TestRadioButtonsTextValueAdapter(radios[0], container, radios);
        radios[1].checked = true;

        expect(testItem.publicify_element).toBe(radios[0]);
        expect(testItem.publicify_jivsElement).toBe(container);
        expect(testItem.readTextValue()).toBe('second');

        testItem.writeTextValue('first');

        expect(radios.map((radio) => radio.checked)).toEqual([true, false]);
        expect(testItem.readTextValue()).toBe('first');
    });
});

// Disposal releases the group anchor and associated Jivs element references inherited from AdapterBase.
describe('RadioButtonsTextValueAdapterBase.dispose', () => {
    test('Clears the inherited DOM and Jivs element references', () => {
        let { testItem } = setup();

        testItem.dispose();

        expect(testItem.publicify_element).toBeUndefined();
        expect(testItem.publicify_jivsElement).toBeUndefined();
    });
});
