/** @jest-environment jsdom */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { EditorAriaStaticUpdater } from '../../src/Aria/EditorAriaStaticUpdater';
import { ElementRole } from '../../src/Interfaces/Types';

/**
 * Creates an element and a minimal value-host fake with the required flag used by this updater.
 * @param required - Whether the field is configured as required.
 */
function setup(required: boolean): {
    element: IJivsElement,
    valueHost: IFieldValueHost,
    testItem: EditorAriaStaticUpdater
}
{
    return {
        element: document.createElement('input') as IJivsElement,
        valueHost: { required } as unknown as IFieldValueHost,
        testItem: new EditorAriaStaticUpdater()
    };
}

// EditorAriaStaticUpdater adds static required semantics only for editor-role elements configured as required.
describe('EditorAriaStaticUpdater.applyStaticAttributes', () => {
    test('Adds aria-required when an editor is configured as required', () => {
        let { element, valueHost, testItem } = setup(true);

        testItem.applyStaticAttributes(element, ElementRole.editor, valueHost);

        expect(element.getAttribute('aria-required')).toBe('true');
    });
    test('Does not add aria-required when an editor is not required', () => {
        let { element, valueHost, testItem } = setup(false);

        testItem.applyStaticAttributes(element, ElementRole.editor, valueHost);

        expect(element.hasAttribute('aria-required')).toBe(false);
    });
    test('Does not add aria-required when the optional value host is omitted', () => {
        let element = document.createElement('input') as IJivsElement;
        let testItem = new EditorAriaStaticUpdater();

        testItem.applyStaticAttributes(element, ElementRole.editor);

        expect(element.hasAttribute('aria-required')).toBe(false);
    });
    test('Does not add aria-required for a non-editor role even when the field is required', () => {
        let { element, valueHost, testItem } = setup(true);

        testItem.applyStaticAttributes(element, ElementRole.label, valueHost);

        expect(element.hasAttribute('aria-required')).toBe(false);
    });
    test('Preserves a developer-provided aria-required value', () => {
        let { element, valueHost, testItem } = setup(true);
        element.setAttribute('aria-required', 'false');

        testItem.applyStaticAttributes(element, ElementRole.editor, valueHost);

        expect(element.getAttribute('aria-required')).toBe('false');
    });
    test('Preserves an existing empty aria-required attribute', () => {
        let { element, valueHost, testItem } = setup(true);
        element.setAttribute('aria-required', '');

        testItem.applyStaticAttributes(element, ElementRole.editor, valueHost);

        expect(element.hasAttribute('aria-required')).toBe(true);
        expect(element.getAttribute('aria-required')).toBe('');
    });
});
