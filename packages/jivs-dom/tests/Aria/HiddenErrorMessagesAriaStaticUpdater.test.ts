/** @jest-environment jsdom */
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { HiddenErrorMessagesAriaStaticUpdater } from '../../src/Aria/HiddenErrorMessagesAriaStaticUpdater';
import { ElementRole } from '../../src/Interfaces/Types';

/**
 * Creates an aria-error element and a static updater using the supplied hidden class, or the default.
 */
function setup(hiddenClass?: string): {
    element: IJivsElement,
    testItem: HiddenErrorMessagesAriaStaticUpdater
}
{
    return {
        element: document.createElement('span') as IJivsElement,
        testItem: new HiddenErrorMessagesAriaStaticUpdater(hiddenClass)
    };
}

// The updater adds the visually-hidden class only to elements with the aria-error role, leaving other classes alone.
describe('HiddenErrorMessagesAriaStaticUpdater.applyStaticAttributes', () => {
    test('Adds jivs-visually-hidden to an aria-error element', () => {
        let { element, testItem } = setup();

        testItem.applyStaticAttributes(element, ElementRole.ariaError);

        expect(element.classList.contains('jivs-visually-hidden')).toBe(true);
    });
    test('Preserves existing classes', () => {
        let { element, testItem } = setup();
        element.className = 'author-class';

        testItem.applyStaticAttributes(element, ElementRole.ariaError);

        expect(Array.from(element.classList)).toEqual(['author-class', 'jivs-visually-hidden']);
    });
    test('Does not duplicate the class when the author already supplied it', () => {
        let { element, testItem } = setup();
        element.className = 'jivs-visually-hidden';

        testItem.applyStaticAttributes(element, ElementRole.ariaError);

        expect(Array.from(element.classList)).toEqual(['jivs-visually-hidden']);
    });
    test('Uses the class supplied to the constructor instead of the default', () => {
        let { element, testItem } = setup('my-hidden');

        testItem.applyStaticAttributes(element, ElementRole.ariaError);

        expect(Array.from(element.classList)).toEqual(['my-hidden']);
    });
    test('Does nothing for the error role', () => {
        let { element, testItem } = setup();

        testItem.applyStaticAttributes(element, ElementRole.error);

        expect(element.classList.length).toBe(0);
    });
    test('Does nothing for an unknown custom role', () => {
        let { element, testItem } = setup();

        testItem.applyStaticAttributes(element, 'custom-role');

        expect(element.classList.length).toBe(0);
    });
});
