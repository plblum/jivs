import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { ValueAdapterBase } from '../../src/Adapters/ValueAdapterBase';

/**
 * Concrete test adapter that records values passed through ValueAdapterBase's abstract contract.
 */
class TestValueAdapter extends ValueAdapterBase<HTMLInputElement>
{
    private _value: unknown;

    public readValue(): unknown
    {
        return this._value;
    }

    public writeValue(value: unknown): void
    {
        this._value = value;
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
    testItem: TestValueAdapter
}
{
    let element = document.createElement('input');
    return {
        element: element,
        testItem: new TestValueAdapter(element, jivsElement)
    };
}

// ValueAdapterBase must preserve the concrete element type and forward its optional associated Jivs element.
describe('ValueAdapterBase constructor', () => {
    test('Exposes the typed DOM element and uses it as the default Jivs element', () => {
        let { element, testItem } = setup();

        expect(testItem.publicify_element).toBe(element);
        expect(testItem.publicify_jivsElement).toBe(element);
    });
    test('Exposes the supplied Jivs element separately from the typed DOM element', () => {
        let element = document.createElement('input');
        let jivsElement = document.createElement('section');
        let testItem = new TestValueAdapter(element, jivsElement);

        expect(testItem.publicify_element).toBe(element);
        expect(testItem.publicify_jivsElement).toBe(jivsElement);
    });
});

// The abstract adapter contract must allow concrete adapters to read and write native values, including undefined.
describe('ValueAdapterBase readValue and writeValue contract', () => {
    test('Returns the value written by the concrete adapter', () => {
        let { testItem } = setup();
        let value = { selected: true };

        testItem.writeValue(value);

        expect(testItem.readValue()).toBe(value);
    });
    test('Allows a concrete adapter to represent the absence of a value with undefined', () => {
        let { testItem } = setup();
        testItem.writeValue('present');

        testItem.writeValue(undefined);

        expect(testItem.readValue()).toBeUndefined();
    });
});

// ValueAdapterBase inherits disposal so consumers can release references through the common adapter API.
describe('ValueAdapterBase.dispose', () => {
    test('Clears the inherited DOM and Jivs element references', () => {
        let { testItem } = setup();

        testItem.dispose();

        expect(testItem.publicify_element).toBeUndefined();
        expect(testItem.publicify_jivsElement).toBeUndefined();
    });
});
