/** @jest-environment jsdom */
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { TextValueAdapterBase } from '../../src/Adapters/TextValueAdapterBase';

/**
 * Concrete test adapter that stores text values passed through TextValueAdapterBase's abstract contract.
 */
class TestTextValueAdapter extends TextValueAdapterBase<HTMLInputElement>
{
    private _textValue: string | undefined;

    public readTextValue(): string | undefined
    {
        return this._textValue;
    }

    public writeTextValue(textValue: string | undefined): void
    {
        this._textValue = textValue;
    }

    public get publicify_element(): HTMLInputElement
    {
        return this.element;
    }

    public get publicify_jivsElement(): IJivsElement
    {
        return this.jivsElement;
    }
}

/**
 * Creates a typed input adapter with an optional associated Jivs element.
 * @param jivsElement - Defaults to null, which uses the input as the Jivs element.
 */
function setup(jivsElement: IJivsElement | null = null): {
    element: HTMLInputElement,
    testItem: TestTextValueAdapter
}
{
    let element = document.createElement('input');
    return {
        element: element,
        testItem: new TestTextValueAdapter(element, jivsElement)
    };
}

// TextValueAdapterBase must preserve the concrete element type and forward its optional associated Jivs element.
describe('TextValueAdapterBase constructor', () => {
    test('Exposes the typed DOM element and uses it as the default Jivs element', () => {
        let { element, testItem } = setup();

        expect(testItem.publicify_element).toBe(element);
        expect(testItem.publicify_jivsElement).toBe(element);
    });
    test('Exposes the supplied Jivs element separately from the typed DOM element', () => {
        let element = document.createElement('input');
        let jivsElement = document.createElement('section');
        let testItem = new TestTextValueAdapter(element, jivsElement);

        expect(testItem.publicify_element).toBe(element);
        expect(testItem.publicify_jivsElement).toBe(jivsElement);
    });
});

// The text adapter contract must preserve ordinary strings, empty strings, and undefined distinctly.
describe('TextValueAdapterBase readTextValue and writeTextValue contract', () => {
    test('Returns the text value written by the concrete adapter', () => {
        let { testItem } = setup();

        testItem.writeTextValue('A user-entered value');

        expect(testItem.readTextValue()).toBe('A user-entered value');
    });
    test('Preserves an empty string as a text value', () => {
        let { testItem } = setup();

        testItem.writeTextValue('');

        expect(testItem.readTextValue()).toBe('');
    });
    test('Allows a concrete adapter to represent the absence of a value with undefined', () => {
        let { testItem } = setup();
        testItem.writeTextValue('present');

        testItem.writeTextValue(undefined);

        expect(testItem.readTextValue()).toBeUndefined();
    });
});

// TextValueAdapterBase inherits disposal so consumers can release references through the common adapter API.
describe('TextValueAdapterBase.dispose', () => {
    test('Clears the inherited DOM and Jivs element references', () => {
        let { testItem } = setup();

        testItem.dispose();

        expect(testItem.publicify_element).toBeUndefined();
        expect(testItem.publicify_jivsElement).toBeUndefined();
    });
});
