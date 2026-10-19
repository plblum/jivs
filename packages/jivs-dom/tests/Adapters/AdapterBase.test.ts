import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { AdapterBase } from '../../src/Adapters/AdapterBase';

/**
 * Exposes AdapterBase's protected element references for verification.
 */
class Publicify_AdapterBase extends AdapterBase<HTMLElement>
{
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
 * Creates an adapter with a detached div and the optional associated Jivs element.
 * @param jivsElement - The associated Jivs element; defaults to null so the DOM element is used.
 */
function setup(jivsElement: IJivsElement | null = null): {
    element: HTMLElement,
    testItem: Publicify_AdapterBase
}
{
    let element = document.createElement('div');
    return {
        element: element,
        testItem: new Publicify_AdapterBase(element, jivsElement)
    };
}

// The constructor must reject a missing DOM element while supporting either an associated Jivs element or a fallback.
describe('AdapterBase constructor', () => {
    test('Rejects a null DOM element', () => {
        expect(() => new Publicify_AdapterBase(null!, null)).toThrow(/element/);
    });
    test('Rejects an undefined DOM element', () => {
        expect(() => new Publicify_AdapterBase(undefined!, null)).toThrow(/element/);
    });
    test('Uses the DOM element as the Jivs element when the associated element is null', () => {
        let { element, testItem } = setup(null);

        expect(testItem.publicify_element).toBe(element);
        expect(testItem.publicify_jivsElement).toBe(element);
    });
    test('Uses the DOM element as the Jivs element when the associated element is undefined', () => {
        let element = document.createElement('div');
        let testItem = new Publicify_AdapterBase(element, undefined!);

        expect(testItem.publicify_jivsElement).toBe(element);
    });
    test('Uses the supplied Jivs element when it is distinct from the DOM element', () => {
        let element = document.createElement('div');
        let jivsElement = document.createElement('section');
        let testItem = new Publicify_AdapterBase(element, jivsElement);

        expect(testItem.publicify_element).toBe(element);
        expect(testItem.publicify_jivsElement).toBe(jivsElement);
    });
});

// Disposing releases both retained element references and remains safe if called again.
describe('AdapterBase.dispose', () => {
    test('Clears the DOM element and associated Jivs element references', () => {
        let { testItem } = setup();

        testItem.dispose();

        expect(testItem.publicify_element).toBeUndefined();
        expect(testItem.publicify_jivsElement).toBeUndefined();
    });
    test('Can be called more than once', () => {
        let { testItem } = setup();
        testItem.dispose();

        expect(() => testItem.dispose()).not.toThrow();
        expect(testItem.publicify_element).toBeUndefined();
        expect(testItem.publicify_jivsElement).toBeUndefined();
    });
});
