/** @jest-environment jsdom */
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import {
    defaultWrappedCheckboxPresentationName,
    WrappedCheckboxPresentation
} from '../../src/FieldPresentations/WrappedCheckboxPresentation';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

function initialize(presentation: WrappedCheckboxPresentation): void
{
    let domServices: IJivsDomServices = createMockJivsDomServices();
    presentation.init({
        services: { domServices: domServices }
    } as unknown as IValueHostsManager);
}

// Wrapped checkboxes identify the wrapper and leave native input styling to the inner control.
describe('WrappedCheckboxPresentation CSS classes', () => {
    test('Adds persistent classes to the wrapper and leaves its checkbox child unchanged', () => {
        let wrapper = document.createElement('div');
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        wrapper.appendChild(checkbox);
        let presentation = new WrappedCheckboxPresentation(wrapper);

        initialize(presentation);

        expect(wrapper.className).toBe(
            'jivs-isvalidpresentation jivs-wrapped-editor jivs-wrapped-editor-checkbox'
        );
        expect(checkbox.className).toBe('');
    });

    test('Adds variation classes after the persistent classes', () => {
        let wrapper = document.createElement('div');
        let presentation = new WrappedCheckboxPresentation(wrapper, {
            variationClasses: ['checkbox-wrapper', 'inline']
        });

        initialize(presentation);

        expect(wrapper.className).toBe(
            'jivs-isvalidpresentation jivs-wrapped-editor jivs-wrapped-editor-checkbox checkbox-wrapper inline'
        );
    });
});

// The public name matches the wrapped-checkbox factory registration.
describe('WrappedCheckboxPresentation default name', () => {
    test('Uses the wrappedCheckboxEditor factory name', () => {
        expect(defaultWrappedCheckboxPresentationName).toBe('wrappedCheckboxEditor');
    });
});
