/** @jest-environment jsdom */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { AriaStaticUpdaterBase } from '../../src/Aria/AriaStaticUpdaterBase';
import { ElementRole } from '../../src/Interfaces/Types';

/**
 * Exposes protected helpers from AriaStaticUpdaterBase for focused testing.
 */
class Publicify_AriaStaticUpdaterBase extends AriaStaticUpdaterBase
{
    public applyStaticAttributes(element: IJivsElement, role: ElementRole | string, valueHost?: IFieldValueHost): void
    {
    }

    public publicify_addAttribute(element: IJivsElement, name: string, value: string): void
    {
        this.addAttribute(element, name, value);
    }

    public publicify_resolvingAriaHostElement(element: IJivsElement): IJivsElement
    {
        return this.resolvingAriaHostElement(element);
    }
}

/**
 * Creates a new DOM element and its publicified updater.
 */
function setup(): {
    element: IJivsElement,
    testItem: Publicify_AriaStaticUpdaterBase
}
{
    let element = document.createElement('div') as IJivsElement;
    return {
        element: element,
        testItem: new Publicify_AriaStaticUpdaterBase()
    };
}

// AriaStaticUpdaterBase adds a requested ARIA attribute only when the element does not already define it.
describe('AriaStaticUpdaterBase.addAttribute', () => {
    test('Adds an attribute that is absent from the element', () => {
        let { element, testItem } = setup();

        testItem.publicify_addAttribute(element, 'aria-label', 'Account name');

        expect(element.getAttribute('aria-label')).toBe('Account name');
    });
    test('Preserves an existing attribute value', () => {
        let { element, testItem } = setup();
        element.setAttribute('aria-label', 'Developer-provided label');

        testItem.publicify_addAttribute(element, 'aria-label', 'Generated label');

        expect(element.getAttribute('aria-label')).toBe('Developer-provided label');
    });
    test('Preserves an existing empty attribute value', () => {
        let { element, testItem } = setup();
        element.setAttribute('role', '');

        testItem.publicify_addAttribute(element, 'role', 'status');

        expect(element.hasAttribute('role')).toBe(true);
        expect(element.getAttribute('role')).toBe('');
    });
    test('Adds separate absent attributes without modifying an existing one', () => {
        let { element, testItem } = setup();
        element.setAttribute('role', 'custom-role');

        testItem.publicify_addAttribute(element, 'role', 'status');
        testItem.publicify_addAttribute(element, 'aria-atomic', 'true');

        expect(element.getAttribute('role')).toBe('custom-role');
        expect(element.getAttribute('aria-atomic')).toBe('true');
    });
});

// The default ARIA host resolution targets the element supplied by the caller.
describe('AriaStaticUpdaterBase.resolvingAriaHostElement', () => {
    test('Returns the same element instance supplied to the resolver', () => {
        let { element, testItem } = setup();

        expect(testItem.publicify_resolvingAriaHostElement(element)).toBe(element);
    });
});
