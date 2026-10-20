/** @jest-environment jsdom */
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import {
    defaultWrappedTextAreaPresentationName,
    WrappedTextAreaPresentation
} from '../../src/FieldPresentations/WrappedTextAreaPresentation';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

function initialize(presentation: WrappedTextAreaPresentation): void
{
    let domServices: IJivsDomServices = createMockJivsDomServices();
    presentation.init({
        services: { domServices: domServices }
    } as unknown as IValueHostsManager);
}

// Wrapped textareas identify their wrapper separately from the contained textarea.
describe('WrappedTextAreaPresentation CSS classes', () => {
    test('Adds persistent classes to the wrapper and leaves its textarea child unchanged', () => {
        let wrapper = document.createElement('div');
        let textarea = document.createElement('textarea');
        wrapper.appendChild(textarea);
        let presentation = new WrappedTextAreaPresentation(wrapper);

        initialize(presentation);

        expect(wrapper.className).toBe(
            'jivs-isvalidpresentation jivs-wrapped-editor jivs-wrapped-editor-textarea'
        );
        expect(textarea.className).toBe('');
    });

    test('Adds variation classes after the persistent classes', () => {
        let wrapper = document.createElement('div');
        let presentation = new WrappedTextAreaPresentation(wrapper, {
            variationClasses: ['multiline', 'wide']
        });

        initialize(presentation);

        expect(wrapper.className).toBe(
            'jivs-isvalidpresentation jivs-wrapped-editor jivs-wrapped-editor-textarea multiline wide'
        );
    });
});

// The public name matches the wrapped textarea factory registration.
describe('WrappedTextAreaPresentation default name', () => {
    test('Uses the wrappedTextAreaEditor factory name', () => {
        expect(defaultWrappedTextAreaPresentationName).toBe('wrappedTextAreaEditor');
    });
});
