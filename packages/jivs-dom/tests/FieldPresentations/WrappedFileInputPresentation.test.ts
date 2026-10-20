/** @jest-environment jsdom */
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import {
    defaultWrappedFileInputPresentationName,
    WrappedFileInputPresentation
} from '../../src/FieldPresentations/WrappedFileInputPresentation';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

function initialize(presentation: WrappedFileInputPresentation): void
{
    let domServices: IJivsDomServices = createMockJivsDomServices();
    presentation.init({
        services: { domServices: domServices }
    } as unknown as IValueHostsManager);
}

// Wrapped file inputs identify their wrapper separately from the native file control.
describe('WrappedFileInputPresentation CSS classes', () => {
    test('Adds persistent classes to the wrapper and leaves its file-input child unchanged', () => {
        let wrapper = document.createElement('div');
        let fileInput = document.createElement('input');
        fileInput.type = 'file';
        wrapper.appendChild(fileInput);
        let presentation = new WrappedFileInputPresentation(wrapper);

        initialize(presentation);

        expect(wrapper.className).toBe(
            'jivs-isvalidpresentation jivs-wrapped-editor jivs-wrapped-editor-file-input'
        );
        expect(fileInput.className).toBe('');
    });

    test('Adds variation classes after the persistent classes', () => {
        let wrapper = document.createElement('div');
        let presentation = new WrappedFileInputPresentation(wrapper, {
            variationClasses: 'attachment-wrapper'
        });

        initialize(presentation);

        expect(wrapper.className).toBe(
            'jivs-isvalidpresentation jivs-wrapped-editor jivs-wrapped-editor-file-input attachment-wrapper'
        );
    });
});

// The public name matches the wrapped-file-input factory registration.
describe('WrappedFileInputPresentation default name', () => {
    test('Uses the wrappedFileInputEditor factory name', () => {
        expect(defaultWrappedFileInputPresentationName).toBe('wrappedFileInputEditor');
    });
});
