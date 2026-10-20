/** @jest-environment jsdom */
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import {
    defaultWrappedRadioButtonsPresentationName,
    WrappedRadioButtonsPresentation
} from '../../src/FieldPresentations/WrappedRadioButtonsPresentation';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

function initialize(presentation: WrappedRadioButtonsPresentation): void
{
    let domServices: IJivsDomServices = createMockJivsDomServices();
    presentation.init({
        services: { domServices: domServices }
    } as unknown as IValueHostsManager);
}

// Wrapped radio groups identify their wrapper without adding presentation classes to individual radios.
describe('WrappedRadioButtonsPresentation CSS classes', () => {
    test('Adds persistent classes to the wrapper and leaves its radio children unchanged', () => {
        let wrapper = document.createElement('div');
        let firstRadio = document.createElement('input');
        firstRadio.type = 'radio';
        let secondRadio = document.createElement('input');
        secondRadio.type = 'radio';
        wrapper.append(firstRadio, secondRadio);
        let presentation = new WrappedRadioButtonsPresentation(wrapper);

        initialize(presentation);

        expect(wrapper.className).toBe(
            'jivs-isvalidpresentation jivs-wrapped-editor jivs-wrapped-editor-radiobuttons'
        );
        expect(firstRadio.className).toBe('');
        expect(secondRadio.className).toBe('');
    });

    test('Adds variation classes after the persistent classes', () => {
        let wrapper = document.createElement('fieldset');
        let presentation = new WrappedRadioButtonsPresentation(wrapper, {
            variationClasses: 'radio-group'
        });

        initialize(presentation);

        expect(wrapper.className).toBe(
            'jivs-isvalidpresentation jivs-wrapped-editor jivs-wrapped-editor-radiobuttons radio-group'
        );
    });
});

// The public name matches the wrapped-radio-buttons factory registration.
describe('WrappedRadioButtonsPresentation default name', () => {
    test('Uses the wrappedRadioButtonsEditor factory name', () => {
        expect(defaultWrappedRadioButtonsPresentationName).toBe('wrappedRadioButtonsEditor');
    });
});
