/** @jest-environment jsdom */
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import {
    defaultWrappedTextInputPresentationName,
    WrappedTextInputPresentation
} from '../../src/FieldPresentations/WrappedTextInputPresentation';
import { WrappedEditorFieldPresentationBaseOptions } from '../../src/FieldPresentations/WrappedEditorFieldPresentationBase';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

function initialize(presentation: WrappedTextInputPresentation): void
{
    let domServices: IJivsDomServices = createMockJivsDomServices();
    presentation.init({
        services: { domServices: domServices }
    } as unknown as IValueHostsManager);
}

// Wrapped text inputs identify the wrapper with shared and input-specific persistent classes.
describe('WrappedTextInputPresentation CSS classes', () => {
    test('Adds persistent classes to the wrapper and leaves its input child unchanged', () => {
        let wrapper = document.createElement('div');
        let input = document.createElement('input');
        input.type = 'text';
        wrapper.appendChild(input);
        let presentation = new WrappedTextInputPresentation(wrapper);

        initialize(presentation);

        expect(wrapper.className).toBe(
            'jivs-isvalidpresentation jivs-wrapped-editor jivs-wrapped-editor-input'
        );
        expect(input.className).toBe('');
    });

    test('Adds variation classes after the persistent classes', () => {
        let wrapper = document.createElement('div');
        let options: WrappedEditorFieldPresentationBaseOptions = {
            variationClasses: 'wide compact'
        };
        let presentation = new WrappedTextInputPresentation(wrapper, options);

        initialize(presentation);

        expect(wrapper.className).toBe(
            'jivs-isvalidpresentation jivs-wrapped-editor jivs-wrapped-editor-input wide compact'
        );
    });
});

// The public name matches the wrapped text-input factory registration.
describe('WrappedTextInputPresentation default name', () => {
    test('Uses the wrappedInputEditor factory name', () => {
        expect(defaultWrappedTextInputPresentationName).toBe('wrappedInputEditor');
    });
});
