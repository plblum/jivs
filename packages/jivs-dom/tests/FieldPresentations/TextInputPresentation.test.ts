/** @jest-environment jsdom */
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import {
    defaultTextInputPresentationName,
    TextInputPresentation
} from '../../src/FieldPresentations/TextInputPresentation';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

function createPresentation(): {
    presentation: TextInputPresentation;
    element: HTMLInputElement;
}
{
    let element = document.createElement('input');
    element.type = 'text';
    return {
        presentation: new TextInputPresentation(element),
        element: element
    };
}

function initialize(presentation: TextInputPresentation): void
{
    let domServices: IJivsDomServices = createMockJivsDomServices();
    presentation.init({
        services: { domServices: domServices }
    } as unknown as IValueHostsManager);
}

// Text inputs receive both shared editor classes and their input-specific identity class.
describe('TextInputPresentation CSS classes', () => {
    test('Adds the persistent input-editor classes to the input', () => {
        let { presentation, element } = createPresentation();

        initialize(presentation);

        expect(element.className).toBe(
            'jivs-isvalidpresentation jivs-editor jivs-editor-input'
        );
    });

    test('Adds variation classes after its persistent classes', () => {
        let element = document.createElement('input');
        let presentation = new TextInputPresentation(element, {
            variationClasses: 'wide search-input'
        });

        initialize(presentation);

        expect(element.className).toBe(
            'jivs-isvalidpresentation jivs-editor jivs-editor-input wide search-input'
        );
    });
});

// The public name matches the name used to register the text-input presentation.
describe('TextInputPresentation default name', () => {
    test('Uses the inputEditor factory name', () => {
        expect(defaultTextInputPresentationName).toBe('inputEditor');
    });
});
