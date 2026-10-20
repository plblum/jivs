/** @jest-environment jsdom */
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { WrappedRadioButtonsAriaStaticUpdater } from '../../src/Aria/WrappedRadioButtonsAriaStaticUpdater';
import { ElementRole } from '../../src/Interfaces/Types';

/**
 * Creates a wrapper element and its static updater.
 */
function setup(): {
    element: IJivsElement,
    testItem: WrappedRadioButtonsAriaStaticUpdater
}
{
    let element = document.createElement('div');
    let values = ['first', 'second', 'third'];
    let radios = values.map((value) =>
    {
        let radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'test-group';
        radio.value = value;
        element.append(radio);
        return radio;
    });    
    return {
        element: element as IJivsElement,
        testItem: new WrappedRadioButtonsAriaStaticUpdater()
    };
}

// The wrapped radio updater assigns group semantics to editor wrappers and preserves authored roles.
describe('WrappedRadioButtonsAriaStaticUpdater.applyStaticAttributes', () => {
    test('Adds role=radiogroup to an editor wrapper when no role is present', () => {
        let { element, testItem } = setup();

        testItem.applyStaticAttributes(element, ElementRole.editor);

        expect(element.getAttribute('role')).toBe('radiogroup');
    });
    test('Preserves an existing role on an editor wrapper', () => {
        let { element, testItem } = setup();
        element.setAttribute('role', 'group');

        testItem.applyStaticAttributes(element, ElementRole.editor);

        expect(element.getAttribute('role')).toBe('group');
    });
    test('Preserves an existing empty role attribute on an editor wrapper', () => {
        let { element, testItem } = setup();
        element.setAttribute('role', '');

        testItem.applyStaticAttributes(element, ElementRole.editor);

        expect(element.hasAttribute('role')).toBe(true);
        expect(element.getAttribute('role')).toBe('');
    });
    test('Does not assign a role when the supplied element is not an editor role', () => {
        let { element, testItem } = setup();

        testItem.applyStaticAttributes(element, ElementRole.container);

        expect(element.hasAttribute('role')).toBe(false);
    });
    test('Does not replace a role for an unknown custom role', () => {
        let { element, testItem } = setup();
        element.setAttribute('role', 'application');

        testItem.applyStaticAttributes(element, 'custom-editor-role');

        expect(element.getAttribute('role')).toBe('application');
    });
});
