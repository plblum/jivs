import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { RadioButtonsTextValueAdapter } from '../../src/Adapters/RadioButtonsTextValueAdapter';

/**
 * Creates a radio input with the supplied name and value.
 * @param name - Radio group name; defaults to 'test-group'.
 * @param value - Radio value; defaults to 'first'.
 */
function createRadio(name: string = 'test-group', value: string = 'first'): HTMLInputElement
{
    let radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = name;
    radio.value = value;
    return radio;
}

/**
 * Creates a pair of sibling radios and an adapter anchored to the first radio.
 * @param jivsElement - Defaults to null, so the anchor radio is the Jivs element.
 */
function setup(jivsElement: IJivsElement | null = null): {
    parent: HTMLElement,
    radios: HTMLInputElement[],
    testItem: RadioButtonsTextValueAdapter
}
{
    let parent = document.createElement('div');
    let radios = [
        createRadio('test-group', 'first'),
        createRadio('test-group', 'second')
    ];
    parent.append(...radios);
    return {
        parent: parent,
        radios: radios,
        testItem: new RadioButtonsTextValueAdapter(radios[0], jivsElement)
    };
}

// A radio anchor can carry the IJivsElement state itself while the adapter discovers and operates on its sibling group.
describe('RadioButtonsTextValueAdapter with a radio button as IJivsElement', () => {
    test('Reads the selected sibling and writes the matching value across the group', () => {
        let { radios, testItem } = setup();
        radios[1].checked = true;

        expect(testItem.readTextValue()).toBe('second');

        testItem.writeTextValue('first');

        expect(radios.map((radio) => radio.checked)).toEqual([true, false]);
        expect(testItem.readTextValue()).toBe('first');
    });
    test('Uses the anchor radio as the Jivs element when the associated element is undefined', () => {
        let parent = document.createElement('div');
        let radio = createRadio();
        parent.append(radio);
        let testItem = new RadioButtonsTextValueAdapter(radio, undefined!);

        radio.checked = true;

        expect(testItem.readTextValue()).toBe('first');
    });
});

// A containing div can own the IJivsElement state while the adapter is anchored to one of its sibling radios.
describe('RadioButtonsTextValueAdapter with a containing div as IJivsElement', () => {
    test('Reads and updates the radio group while retaining the container as the Jivs element', () => {
        let { parent, radios } = setup();
        let testItem = new RadioButtonsTextValueAdapter(radios[0], parent);
        radios[1].checked = true;

        expect(testItem.readTextValue()).toBe('second');

        testItem.writeTextValue('first');

        expect(radios.map((radio) => radio.checked)).toEqual([true, false]);
        expect(testItem.readTextValue()).toBe('first');
    });
});

// Radio groups are discovered by their shared name under the anchor's parent, excluding other names and input types.
describe('RadioButtonsTextValueAdapter group discovery', () => {
    test('Finds matching same-name sibling radios and ignores unrelated sibling inputs', () => {
        let parent = document.createElement('div');
        let first = createRadio('shared-name', 'one');
        let otherName = createRadio('other-name', 'other');
        let otherType = document.createElement('input');
        otherType.type = 'text';
        otherType.name = 'shared-name';
        let second = createRadio('shared-name', 'two');
        parent.append(first, otherName, otherType, second);
        let testItem = new RadioButtonsTextValueAdapter(first);

        testItem.writeTextValue('two');

        expect(first.checked).toBe(false);
        expect(second.checked).toBe(true);
        expect(otherName.checked).toBe(false);
        expect(testItem.readTextValue()).toBe('two');
    });
    test('Uses only the anchor radio when it has no name', () => {
        let parent = document.createElement('div');
        let unnamed = createRadio('', 'unnamed');
        let named = createRadio('named-group', 'named');
        parent.append(unnamed, named);
        let testItem = new RadioButtonsTextValueAdapter(unnamed);

        testItem.writeTextValue('named');

        expect(unnamed.checked).toBe(false);
        expect(named.checked).toBe(false);

        testItem.writeTextValue('unnamed');

        expect(unnamed.checked).toBe(true);
        expect(named.checked).toBe(false);
        expect(testItem.readTextValue()).toBe('unnamed');
    });
    test('Uses only the anchor radio when it has no parent', () => {
        let detachedRadio = createRadio('detached-group', 'detached');
        let testItem = new RadioButtonsTextValueAdapter(detachedRadio);

        testItem.writeTextValue('detached');

        expect(detachedRadio.checked).toBe(true);
        expect(testItem.readTextValue()).toBe('detached');
    });
    test('Uses the current sibling group on each read and write', () => {
        let parent = document.createElement('div');
        let first = createRadio('dynamic-group', 'first');
        parent.append(first);
        let testItem = new RadioButtonsTextValueAdapter(first);
        let addedRadio = createRadio('dynamic-group', 'added-later');
        parent.append(addedRadio);

        testItem.writeTextValue('added-later');

        expect(first.checked).toBe(false);
        expect(addedRadio.checked).toBe(true);
        expect(testItem.readTextValue()).toBe('added-later');
    });
});

// The public group lookup rejects non-radio elements and returns the anchor as a singleton when grouping is unavailable.
describe('RadioButtonsTextValueAdapter.getAllSiblingRadioButtons', () => {
    test('Throws when the supplied input is not a radio button', () => {
        let textInput = document.createElement('input');
        textInput.type = 'text';

        expect(() => RadioButtonsTextValueAdapter.getAllSiblingRadioButtons(textInput)).toThrow(
            'Provided element is not a radio button.'
        );
    });
    test('Returns the unnamed radio itself without searching its parent', () => {
        let parent = document.createElement('div');
        let radio = createRadio('', 'unnamed');
        let otherRadio = createRadio('', 'other');
        parent.append(radio, otherRadio);

        expect(RadioButtonsTextValueAdapter.getAllSiblingRadioButtons(radio)).toEqual([radio]);
    });
    test('Returns the named radio itself when it has no parent', () => {
        let radio = createRadio('detached-group', 'detached');

        expect(RadioButtonsTextValueAdapter.getAllSiblingRadioButtons(radio)).toEqual([radio]);
    });
    test('Returns only same-name radio descendants of the anchor parent', () => {
        let parent = document.createElement('div');
        let anchor = createRadio('parent-group', 'anchor');
        let sibling = createRadio('parent-group', 'sibling');
        let differentName = createRadio('different-group', 'different');
        let otherType = document.createElement('input');
        otherType.type = 'checkbox';
        otherType.name = 'parent-group';
        let otherParent = document.createElement('div');
        let outsideRadio = createRadio('parent-group', 'outside');
        parent.append(anchor, sibling, differentName, otherType);
        otherParent.append(outsideRadio);

        expect(RadioButtonsTextValueAdapter.getAllSiblingRadioButtons(anchor)).toEqual([anchor, sibling]);
    });
});

// Disposing releases the radio anchor and associated Jivs element references inherited from AdapterBase.
describe('RadioButtonsTextValueAdapter.dispose', () => {
    test('Clears inherited references and later value operations fail rather than using the released anchor', () => {
        let { testItem } = setup();

        testItem.dispose();

        expect(() => testItem.readTextValue()).toThrow(TypeError);
        expect(() => testItem.writeTextValue('first')).toThrow(TypeError);
    });
});
