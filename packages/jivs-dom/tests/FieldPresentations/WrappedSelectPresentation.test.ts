/** @jest-environment jsdom */
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import {
    defaultWrappedSelectPresentationName,
    WrappedSelectPresentation
} from '../../src/FieldPresentations/WrappedSelectPresentation';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

function initialize(presentation: WrappedSelectPresentation): void
{
    let domServices: IJivsDomServices = createMockJivsDomServices();
    presentation.init({
        services: { domServices: domServices }
    } as unknown as IValueHostsManager);
}

// Wrapped selects identify their wrapper separately from the contained select element.
describe('WrappedSelectPresentation CSS classes', () => {
    test('Adds persistent classes to the wrapper and leaves its select child unchanged', () => {
        let wrapper = document.createElement('div');
        let select = document.createElement('select');
        wrapper.appendChild(select);
        let presentation = new WrappedSelectPresentation(wrapper);

        initialize(presentation);

        expect(wrapper.className).toBe(
            'jivs-isvalidpresentation jivs-wrapped-editor jivs-wrapped-editor-select'
        );
        expect(select.className).toBe('');
    });

    test('Adds variation classes after the persistent classes', () => {
        let wrapper = document.createElement('div');
        let presentation = new WrappedSelectPresentation(wrapper, {
            variationClasses: 'select-wrapper'
        });

        initialize(presentation);

        expect(wrapper.className).toBe(
            'jivs-isvalidpresentation jivs-wrapped-editor jivs-wrapped-editor-select select-wrapper'
        );
    });
});

// The public name matches the wrapped-select factory registration.
describe('WrappedSelectPresentation default name', () => {
    test('Uses the wrappedSelectEditor factory name', () => {
        expect(defaultWrappedSelectPresentationName).toBe('wrappedSelectEditor');
    });
});
